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
import { Mail, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Generic item for carpet/upholstery/mattress
interface CleaningItem {
  id: string;
  name: string;
  type?: 'carpet' | 'upholstery' | 'mattress';
  size?: 'small' | 'medium' | 'large';
  quantity: number;
  price: number;
  bothSides?: boolean;
}

interface QuoteData {
  totalCost: number;
  estimatedHours: number | null;
  weeklyHours?: number | null;
  wantsFirstDeepClean?: boolean;
  firstDeepCleanHours?: number | null;
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
  // Carpet cleaning specific
  carpetItems?: CleaningItem[];
  upholsteryItems?: CleaningItem[];
  mattressItems?: CleaningItem[];
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

// Format items for display
const formatItemsForDisplay = (items: CleaningItem[]): string[] => {
  return items.map(item => {
    const bothSidesText = item.bothSides ? ' (Both sides)' : '';
    return `${item.name}${bothSidesText} x${item.quantity} - £${(item.price * item.quantity).toFixed(2)}`;
  });
};

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
  const [quoteSent, setQuoteSent] = useState(false);
  const { toast } = useToast();
  
  const hasValidEmail = initialEmail && initialEmail.includes('@');
  const isCarpetCleaning = serviceType === 'Carpet Cleaning' || serviceType === 'carpet_cleaning';
  
  // Sync email state when initialEmail changes
  React.useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  // Reset quoteSent when dialog opens
  React.useEffect(() => {
    if (open) {
      setQuoteSent(false);
    }
  }, [open]);

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
            // Carpet cleaning specific
            carpetItems: quoteData.carpetItems,
            upholsteryItems: quoteData.upholsteryItems,
            mattressItems: quoteData.mattressItems,
          },
          sessionId,
          serviceType,
        },
      });

      if (error) throw error;

      if (onSaveEmail) {
        onSaveEmail(email);
      }

      setQuoteSent(true);
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

  const handleClose = () => {
    onOpenChange(false);
    if (quoteSent) {
      window.history.back();
    }
  };

  // Carpet cleaning item lists
  const allCarpetItems = quoteData.carpetItems ? formatItemsForDisplay(quoteData.carpetItems) : [];
  const allUpholsteryItems = quoteData.upholsteryItems ? formatItemsForDisplay(quoteData.upholsteryItems) : [];
  const allMattressItems = quoteData.mattressItems ? formatItemsForDisplay(quoteData.mattressItems) : [];
  const hasCarpetItems = allCarpetItems.length > 0 || allUpholsteryItems.length > 0 || allMattressItems.length > 0;

  return (
    <Dialog open={open} onOpenChange={quoteSent ? handleClose : onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border-0 p-0 overflow-hidden shadow-2xl">
        {quoteSent ? (
          <div className="bg-gradient-to-br from-green-500 to-green-600 px-6 py-10 text-center">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Quote Sent!</h2>
            <p className="text-white/90 text-lg mb-6">
              We've sent your quote to <strong>{email}</strong>
            </p>
            <p className="text-white/70 text-sm mb-6">
              Check your inbox for a link to complete your booking anytime.
            </p>
            <Button
              onClick={handleClose}
              className="bg-white text-green-600 hover:bg-white/90 font-medium px-8 py-3 rounded-xl"
              size="lg"
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 px-6 pt-6 pb-5">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-white text-xl font-light tracking-wide">
                  <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  {hasValidEmail ? 'Send Your Quote?' : 'Save Your Quote?'}
                </DialogTitle>
                <DialogDescription className="text-white/80 font-light mt-2 leading-relaxed">
                  {hasValidEmail 
                    ? `We'll send your quote to ${initialEmail} with a link to complete your booking anytime.`
                    : "Don't lose your quote! We can email it to you with a link to complete your booking anytime."
                  }
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="px-6 py-5 space-y-4 bg-white">
              {!hasValidEmail && (
                <div className="space-y-2">
                  <Label htmlFor="quote-email" className="text-sm font-medium text-slate-700">Email Address</Label>
                  <Input
                    id="quote-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    className="rounded-xl border-slate-200 focus:border-slate-400 focus:ring-slate-400 h-12"
                  />
                </div>
              )}
              
              {quoteData.totalCost > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100">
                  <p className="text-sm font-medium text-slate-600">Your Quote Summary</p>
                  
                  {/* Carpet cleaning specific items */}
                  {isCarpetCleaning && hasCarpetItems ? (
                    <div className="space-y-3">
                      {allCarpetItems.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500 font-medium">Carpets & Rugs</p>
                          {allCarpetItems.map((item, idx) => (
                            <p key={idx} className="text-sm text-slate-700">{item}</p>
                          ))}
                        </div>
                      )}
                      
                      {allUpholsteryItems.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500 font-medium">Upholstery</p>
                          {allUpholsteryItems.map((item, idx) => (
                            <p key={idx} className="text-sm text-slate-700">{item}</p>
                          ))}
                        </div>
                      )}
                      
                      {allMattressItems.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500 font-medium">Mattresses</p>
                          {allMattressItems.map((item, idx) => (
                            <p key={idx} className="text-sm text-slate-700">{item}</p>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                        <span className="text-slate-500">Total:</span>
                        <span className="font-semibold text-slate-800">£{quoteData.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">First Cleaning Cost:</span>
                        <span className="font-semibold text-slate-800">£{quoteData.totalCost.toFixed(2)}</span>
                      </div>
                      {(quoteData.wantsFirstDeepClean && quoteData.firstDeepCleanHours) ? (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">First Cleaning Duration:</span>
                          <span className="font-medium text-slate-700">{quoteData.firstDeepCleanHours} hours</span>
                        </div>
                      ) : quoteData.estimatedHours && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Duration:</span>
                          <span className="font-medium text-slate-700">{quoteData.estimatedHours} hours</span>
                        </div>
                      )}
                      {quoteData.isFirstTimeCustomer && quoteData.discountAmount && quoteData.discountAmount > 0 && (
                        <p className="text-xs text-emerald-600 font-medium">
                          Includes 10% first-time customer discount!
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
              
              <Button
                onClick={handleSendQuote}
                disabled={isSending || !email}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl h-12 transition-all"
                size="lg"
              >
                <Mail className="w-4 h-4 mr-2" />
                {isSending ? 'Sending...' : 'Send My Quote'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
