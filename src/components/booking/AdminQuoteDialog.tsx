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
  const [selectedOption, setSelectedOption] = useState<SendOption>(null);
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
  const [sendingEmail, setSendingEmail] = useState(false);
  const { toast } = useToast();
  
  // Sync email/phone state when props change
  React.useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
    if (initialPhone) setPhone(initialPhone);
  }, [initialEmail, initialPhone]);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedOption(null);
      setSendStatus('idle');
    }
  }, [open]);

  // Build the pre-filled URL for "complete booking" option
  const buildCompleteBookingUrl = () => {
    // Use production URL directly
    const baseUrl = 'https://sncleaningservices.co.uk';
    const params = new URLSearchParams();
    
    // Add all the form data as URL parameters
    if (quoteData.propertyType) params.set('propertyType', quoteData.propertyType);
    if (quoteData.bedrooms) params.set('bedrooms', quoteData.bedrooms);
    if (quoteData.bathrooms) params.set('bathrooms', quoteData.bathrooms);
    if (quoteData.serviceFrequency) params.set('frequency', quoteData.serviceFrequency);
    if (quoteData.postcode) params.set('postcode', quoteData.postcode);
    if (quoteData.hasOvenCleaning) params.set('oven', '1');
    if (quoteData.ovenType) params.set('ovenType', quoteData.ovenType);
    if (quoteData.selectedDate) params.set('date', quoteData.selectedDate.toISOString().split('T')[0]);
    if (quoteData.selectedTime) params.set('time', quoteData.selectedTime);
    if (email) params.set('email', email);
    
    // CRITICAL: Include the exact quoted pricing to preserve amounts
    if (quoteData.totalCost) params.set('quotedCost', quoteData.totalCost.toFixed(2));
    if (quoteData.estimatedHours) params.set('quotedHours', quoteData.estimatedHours.toString());
    if (quoteData.shortNoticeCharge) params.set('shortNotice', quoteData.shortNoticeCharge.toString());
    if (quoteData.isFirstTimeCustomer !== undefined) params.set('firstTime', quoteData.isFirstTimeCustomer ? '1' : '0');
    
    // Add session reference for tracking
    if (sessionId) params.set('ref', sessionId);
    
    // Add agent ID for tracking who sent the quote
    if (agentUserId) params.set('agentId', agentUserId);
    
    // Determine the route based on service type
    const route = serviceType === 'Domestic' ? '/domestic-cleaning' : '/airbnb-cleaning';
    
    return `${baseUrl}${route}?${params.toString()}`;
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
    
    const completeUrl = buildCompleteBookingUrl();
    // Only use name if we have a real one
    const customerName = `${quoteData.firstName || ''} ${quoteData.lastName || ''}`.trim();
    
    let emailSent = false;
    let smsSent = false;
    const errors: string[] = [];

    // Send email if we have one
    if (hasEmail) {
      try {
        const { data, error } = await supabase.functions.invoke('send-complete-booking-email', {
          body: {
            email,
            customerName: customerName || 'Valued Customer',
            completeBookingUrl: completeUrl,
            quoteData: {
              totalCost: quoteData.totalCost,
              estimatedHours: quoteData.estimatedHours,
              serviceType,
            },
            sessionId,
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
            customerName, // Pass empty string if no name - edge function handles it
            completeBookingUrl: completeUrl,
            totalCost: quoteData.totalCost,
            estimatedHours: quoteData.estimatedHours,
            serviceType,
            sessionId,
          },
        });

        if (error) throw error;
        smsSent = true;
      } catch (error: any) {
        console.error('Error sending SMS:', error);
        errors.push('SMS');
      }
    }

    setSendingEmail(false);

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
                  className="h-auto py-4 px-5 flex items-start gap-4 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all overflow-hidden"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Link2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-semibold text-foreground">Send to Complete Booking</p>
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
                <Label htmlFor="complete-phone" className="text-sm font-medium text-slate-700">Phone Number (for SMS)</Label>
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