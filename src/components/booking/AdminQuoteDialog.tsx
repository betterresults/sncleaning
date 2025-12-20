import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Send, CheckCircle2, Link2, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuoteData {
  totalCost: number;
  estimatedHours: number | null;
  weeklyHours?: number | null; // Regular weekly hours when first deep clean is selected
  wantsFirstDeepClean?: boolean; // Whether first deep clean option was selected
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  serviceFrequency: string;
  hasOvenCleaning: boolean;
  ovenType: string;
  selectedDate: Date | null;
  selectedTime: string;
  postcode: string;
  shortNoticeCharge?: number;
  isFirstTimeCustomer?: boolean;
  discountAmount?: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  weeklyCost?: number; // Recurring cost for weekly cleans
  // Address fields
  address?: string;
  city?: string;
  houseNumber?: string;
  street?: string;
  // Property access
  propertyAccess?: string;
  accessNotes?: string;
}

interface AdminQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  phone?: string;
  quoteData: QuoteData;
  sessionId: string;
  serviceType: string;
  agentUserId?: string;
  onSaveEmail?: (email: string) => void;
}

type SendOption = 'quote' | 'complete' | null;
type SendStatus = 'idle' | 'sending' | 'success' | 'error';

// Extract the start time from a time slot like "9am - 10am" or "1:00 PM - 2:00 PM"
const extractStartTime = (timeSlot: string | null | undefined): string | null => {
  if (!timeSlot) return null;
  
  // Split by " - " to get the start time
  const parts = timeSlot.split(' - ');
  if (parts.length === 0) return null;
  
  const startTime = parts[0].trim();
  
  // Try to parse and convert to HH:MM format for SQL time
  const timeRegex = /^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/i;
  const match = startTime.match(timeRegex);
  
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const period = match[3]?.toLowerCase();
    
    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }
  
  return null;
};

// Generate a random short code (6 characters, alphanumeric)
const generateShortCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const AdminQuoteDialog: React.FC<AdminQuoteDialogProps> = ({
  open,
  onOpenChange,
  email: initialEmail,
  phone: initialPhone,
  quoteData,
  sessionId,
  serviceType,
  agentUserId,
  onSaveEmail,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone || '');
  const [firstName, setFirstName] = useState(quoteData.firstName || '');
  const [lastName, setLastName] = useState(quoteData.lastName || '');
  const [selectedOption, setSelectedOption] = useState<SendOption>(null);
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [existingQuoteStatus, setExistingQuoteStatus] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const { toast } = useToast();
  
  // Check if there's already a quote/link sent for this session
  React.useEffect(() => {
    const checkExistingQuote = async () => {
      if (!open || !sessionId) return;
      
      setIsCheckingStatus(true);
      try {
        const { data, error } = await supabase
          .from('quote_leads')
          .select('status, quote_email_sent, short_code')
          .eq('session_id', sessionId)
          .maybeSingle();
        
        if (!error && data) {
          setExistingQuoteStatus(data.status);
        } else {
          setExistingQuoteStatus(null);
        }
      } catch (err) {
        console.error('Error checking existing quote:', err);
      } finally {
        setIsCheckingStatus(false);
      }
    };
    
    checkExistingQuote();
  }, [open, sessionId]);
  
  // Sync email/phone/name state when props change
  React.useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
    if (initialPhone) setPhone(initialPhone);
    if (quoteData.firstName) setFirstName(quoteData.firstName);
    if (quoteData.lastName) setLastName(quoteData.lastName);
    if (quoteData.phone) setPhone(quoteData.phone);
  }, [initialEmail, initialPhone, quoteData.firstName, quoteData.lastName, quoteData.phone]);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedOption(null);
      setSendStatus('idle');
    }
  }, [open]);

  // Save quote data to quote_leads and generate short URL
  const saveQuoteAndGetShortUrl = async (): Promise<string> => {
    const shortCode = generateShortCode();
    
    // Build the quote_leads record
    const quoteLeadData = {
      session_id: sessionId || `admin_${Date.now()}`,
      short_code: shortCode,
      agent_user_id: agentUserId,
      service_type: serviceType,
      property_type: quoteData.propertyType,
      bedrooms: quoteData.bedrooms ? parseInt(quoteData.bedrooms) : null,
      bathrooms: quoteData.bathrooms ? parseInt(quoteData.bathrooms) : null,
      frequency: quoteData.serviceFrequency,
      postcode: quoteData.postcode,
      oven_cleaning: quoteData.hasOvenCleaning,
      oven_size: quoteData.ovenType,
      selected_date: quoteData.selectedDate ? quoteData.selectedDate.toISOString().split('T')[0] : null,
      selected_time: quoteData.selectedTime || null, // Store original time slot format (e.g., "9am - 10am")
      calculated_quote: quoteData.totalCost,
      recommended_hours: quoteData.estimatedHours,
      weekly_hours: quoteData.weeklyHours, // Store weekly hours separately
      first_deep_clean: quoteData.wantsFirstDeepClean || false, // Store first deep clean flag
      weekly_cost: quoteData.weeklyCost, // Store recurring cost
      short_notice_charge: quoteData.shortNoticeCharge,
      is_first_time_customer: quoteData.isFirstTimeCustomer,
      discount_amount: quoteData.discountAmount,
      first_name: firstName || null,
      last_name: lastName || null,
      email: email || null,
      phone: phone || null,
      // Address - combine into full address string if components provided
      address: quoteData.address || (quoteData.houseNumber && quoteData.street 
        ? `${quoteData.houseNumber} ${quoteData.street}${quoteData.city ? `, ${quoteData.city}` : ''}`
        : null),
      // Property access
      property_access: quoteData.propertyAccess || null,
      access_notes: quoteData.accessNotes || null,
      status: 'sent',
      source: 'admin',
      created_by_admin_id: agentUserId,
      updated_at: new Date().toISOString(),
    };

    // Upsert (update if session exists, insert if not)
    const { error } = await supabase
      .from('quote_leads')
      .upsert(quoteLeadData, { onConflict: 'session_id' });

    if (error) {
      console.error('Error saving quote lead:', error);
      throw error;
    }

    // Return the short URL
    return `https://account.sncleaningservices.co.uk/b/${shortCode}`;
  };

  const handleSendQuoteEmail = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          email,
          quoteData: {
            totalCost: quoteData.totalCost,
            estimatedHours: quoteData.estimatedHours,
            propertyType: quoteData.propertyType,
            bedrooms: quoteData.bedrooms,
            bathrooms: quoteData.bathrooms,
            serviceFrequency: quoteData.serviceFrequency,
            hasOvenCleaning: quoteData.hasOvenCleaning,
            ovenType: quoteData.ovenType,
            selectedDate: quoteData.selectedDate?.toISOString(),
            selectedTime: quoteData.selectedTime,
            postcode: quoteData.postcode,
            shortNoticeCharge: quoteData.shortNoticeCharge,
            isFirstTimeCustomer: quoteData.isFirstTimeCustomer,
            discountAmount: quoteData.discountAmount,
          },
          sessionId,
          serviceType,
        },
      });

      if (error) throw error;

      if (onSaveEmail) {
        onSaveEmail(email);
      }

      toast({
        title: "Quote Sent",
        description: `Quote email sent to ${email}`,
      });
      
      setSendStatus('success');
    } catch (error: any) {
      console.error('Error sending quote email:', error);
      toast({
        title: "Failed to Send",
        description: "There was an issue sending the quote email.",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendCompleteBooking = async () => {
    const hasEmail = email && email.includes('@');
    const hasPhone = phone && phone.length >= 10;

    if (!hasEmail && !hasPhone) {
      toast({
        title: "Missing Contact Info",
        description: "Please enter an email address or phone number.",
        variant: "destructive",
      });
      return;
    }

    setSendingEmail(true);
    
    try {
      // Save quote data and get short URL
      const completeUrl = await saveQuoteAndGetShortUrl();
      console.log('Generated short URL:', completeUrl);
      
      // Use local state for name
      const customerName = firstName.trim();
      
      let emailSent = false;
      let smsSent = false;
      const errors: string[] = [];

      // Send email if we have one - use the template-based notification system
      if (hasEmail) {
        try {
          const { data, error } = await supabase.functions.invoke('send-notification-email', {
            body: {
              template: 'complete_booking_link',
              recipient_email: email,
              variables: {
                customer_name: customerName || 'Valued Customer',
                service_type: serviceType === 'Domestic' ? 'domestic' : serviceType === 'Airbnb' ? 'Airbnb' : 'cleaning',
                total_cost: quoteData.totalCost.toFixed(2),
                estimated_hours: quoteData.estimatedHours ? String(quoteData.estimatedHours) : '',
                postcode: quoteData.postcode || '',
                booking_url: completeUrl,
              },
            },
          });

          if (error) throw error;
          emailSent = true;
          
          if (onSaveEmail) {
            onSaveEmail(email);
          }
        } catch (error: any) {
          console.error('Error sending email:', error);
          errors.push('email');
        }
      }

      // Send SMS if we have a phone number
      if (hasPhone) {
        try {
          const { data, error } = await supabase.functions.invoke('send-complete-booking-sms', {
            body: {
              phoneNumber: phone,
              customerName,
              completeBookingUrl: completeUrl,
              totalCost: quoteData.totalCost,
              estimatedHours: quoteData.estimatedHours,
              serviceType,
              sessionId,
              postcode: quoteData.postcode,
            },
          });

          if (error) throw error;
          smsSent = true;
        } catch (error: any) {
          console.error('Error sending SMS:', error);
          errors.push('SMS');
        }
      }

      // Only show toast for errors, success screen handles success
      if (emailSent || smsSent) {
        setSendStatus('success');
      } else {
        toast({
          title: "Failed to Send",
          description: `Could not send ${errors.join(' or ')}.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error saving quote data:', error);
      toast({
        title: "Failed to Send",
        description: "Could not save quote data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedOption(null);
    setSendStatus('idle');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl border-0 p-0 overflow-hidden shadow-2xl">
        {sendStatus === 'success' ? (
          // Success state
          <div className="bg-gradient-to-br from-green-500 to-green-600 px-6 py-10 text-center">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Sent Successfully!</h2>
            <p className="text-white/90 text-lg mb-6">
              The customer will receive the {selectedOption === 'quote' ? 'quote' : 'booking link'} shortly.
            </p>
            <Button
              onClick={handleClose}
              className="bg-white text-green-600 hover:bg-white/90 font-medium px-8 py-3 rounded-xl"
              size="lg"
            >
              Close
            </Button>
          </div>
        ) : !selectedOption ? (
          // Option selection screen
          <>
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 px-6 pt-6 pb-5">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-white text-xl font-light tracking-wide">
                  <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  Send to Customer
                </DialogTitle>
                <DialogDescription className="text-white/80 font-light mt-2 leading-relaxed">
                  Choose how you want to send the booking information to the customer.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="px-6 py-5 space-y-4 bg-white">
              {/* Status banner if quote/link already sent */}
              {existingQuoteStatus && ['sent', 'link_clicked'].includes(existingQuoteStatus) && (
                <div className={`rounded-xl p-4 border ${
                  existingQuoteStatus === 'link_clicked' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {existingQuoteStatus === 'link_clicked' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Mail className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${
                        existingQuoteStatus === 'link_clicked' ? 'text-green-800' : 'text-amber-800'
                      }`}>
                        {existingQuoteStatus === 'link_clicked' 
                          ? 'Customer has clicked the booking link!' 
                          : 'A booking link was already sent to this customer'}
                      </p>
                      <p className={`text-xs ${
                        existingQuoteStatus === 'link_clicked' ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        {existingQuoteStatus === 'link_clicked' 
                          ? 'They may be completing their booking now' 
                          : 'You can still resend if needed'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quote Summary */}
              {quoteData.totalCost > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100">
                  <p className="text-sm font-medium text-slate-600">Quote Summary</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Cost:</span>
                    <span className="font-semibold text-slate-800">£{quoteData.totalCost.toFixed(2)}</span>
                  </div>
                  {quoteData.estimatedHours && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Duration:</span>
                      <span className="font-medium text-slate-700">{quoteData.estimatedHours} hours</span>
                    </div>
                  )}
                </div>
              )}

              {/* Option buttons */}
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => setSelectedOption('quote')}
                  variant="outline"
                  className="h-auto py-4 px-5 flex items-start gap-4 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Send Quote</p>
                    <p className="text-sm text-muted-foreground font-normal">
                      Send an email with the pricing quote for the customer to review
                    </p>
                  </div>
                </Button>

                <Button
                  onClick={() => setSelectedOption('complete')}
                  variant="outline"
                  className={`h-auto py-4 px-5 flex items-start gap-4 border-2 rounded-xl transition-all overflow-hidden ${
                    existingQuoteStatus === 'sent' 
                      ? 'border-amber-300 bg-amber-50/50' 
                      : existingQuoteStatus === 'link_clicked'
                        ? 'border-green-300 bg-green-50/50'
                        : 'hover:border-primary hover:bg-primary/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    existingQuoteStatus === 'link_clicked' 
                      ? 'bg-green-100' 
                      : existingQuoteStatus === 'sent'
                        ? 'bg-amber-100'
                        : 'bg-primary/10'
                  }`}>
                    <Link2 className={`w-5 h-5 ${
                      existingQuoteStatus === 'link_clicked' 
                        ? 'text-green-600' 
                        : existingQuoteStatus === 'sent'
                          ? 'text-amber-600'
                          : 'text-primary'
                    }`} />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      {existingQuoteStatus === 'sent' ? 'Resend Booking Link' : 'Send to Complete Booking'}
                    </p>
                    <p className="text-sm text-muted-foreground font-normal break-words">
                      Send a link with details pre-filled to complete booking
                    </p>
                  </div>
                </Button>
              </div>

              <Button
                onClick={handleClose}
                variant="ghost"
                className="w-full text-muted-foreground rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </>
        ) : selectedOption === 'quote' ? (
          // Send Quote screen
          <>
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 px-6 pt-6 pb-5">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-white text-xl font-light tracking-wide">
                  <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  Send Quote Email
                </DialogTitle>
                <DialogDescription className="text-white/80 font-light mt-2 leading-relaxed">
                  Send the pricing quote to the customer's email.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="px-6 py-5 space-y-4 bg-white">
              <div className="space-y-2">
                <Label htmlFor="quote-email" className="text-sm font-medium text-slate-700">Email Address</Label>
                <Input
                  id="quote-email"
                  type="email"
                  placeholder="customer@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary h-12"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setSelectedOption(null)}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSendQuoteEmail}
                  disabled={sendingEmail || !email}
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-xl"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Quote
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Send Complete Booking screen
          <>
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 px-6 pt-6 pb-5">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-white text-xl font-light tracking-wide">
                  <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-white" />
                  </div>
                  Send Complete Booking Link
                </DialogTitle>
                <DialogDescription className="text-white/80 font-light mt-2 leading-relaxed">
                  Send a link with all form details pre-filled so the customer can complete the booking.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="px-6 py-5 space-y-4 bg-white">
              <div className="space-y-2">
                <Label htmlFor="complete-firstname" className="text-sm font-medium text-slate-700">Name</Label>
                <Input
                  id="complete-firstname"
                  type="text"
                  placeholder="Customer name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complete-email" className="text-sm font-medium text-slate-700">Email Address</Label>
                <Input
                  id="complete-email"
                  type="email"
                  placeholder="customer@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complete-phone" className="text-sm font-medium text-slate-700">Phone Number</Label>
                <Input
                  id="complete-phone"
                  type="tel"
                  placeholder="+44 7XXX XXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary h-12"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setSelectedOption(null)}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSendCompleteBooking}
                  disabled={sendingEmail || (!email && !phone)}
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-xl"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Will send via {email && phone ? 'email and SMS' : email ? 'email' : phone ? 'SMS' : 'email or SMS'}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};