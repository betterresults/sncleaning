import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, X } from "lucide-react";
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
}

interface ExitQuotePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  quoteData: QuoteData;
  sessionId: string;
  serviceType: string;
  onSaveEmail?: (email: string) => void;
}

export const ExitQuotePopup: React.FC<ExitQuotePopupProps> = ({
  open,
  onOpenChange,
  email: initialEmail,
  quoteData,
  sessionId,
  serviceType,
  onSaveEmail,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  
  // Check if email is already provided (valid email)
  const hasValidEmail = initialEmail && initialEmail.includes('@');
  
  // Sync email state when initialEmail changes
  React.useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSendQuote = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
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

      // Save the email to the quote lead session
      if (onSaveEmail) {
        onSaveEmail(email);
      }

      toast({
        title: "Quote Sent!",
        description: "We've sent your quote to your email with a link to complete your booking.",
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending quote email:', error);
      toast({
        title: "Failed to Send",
        description: "There was an issue sending your quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            {hasValidEmail ? 'Send Your Quote?' : 'Save Your Quote?'}
          </DialogTitle>
          <DialogDescription>
            {hasValidEmail 
              ? `We'll send your quote to ${initialEmail} with a link to complete your booking anytime.`
              : "Don't lose your quote! We can email it to you with a link to complete your booking anytime."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {!hasValidEmail && (
            <div className="space-y-2">
              <Label htmlFor="quote-email">Email Address</Label>
              <Input
                id="quote-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
          )}
          
        {quoteData.totalCost > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Your Quote Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">First Cleaning Cost:</span>
                <span className="font-semibold">£{quoteData.totalCost.toFixed(2)}</span>
              </div>
              {quoteData.estimatedHours && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{quoteData.estimatedHours} hours</span>
                </div>
              )}
              {quoteData.isFirstTimeCustomer && quoteData.discountAmount && quoteData.discountAmount > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  Includes 10% first-time customer discount!
                </p>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            No Thanks
          </Button>
          <Button
            onClick={handleSendQuote}
            disabled={isSending || !email}
            className="w-full sm:w-auto"
          >
            <Mail className="w-4 h-4 mr-2" />
            {isSending ? 'Sending...' : 'Send My Quote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
