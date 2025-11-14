import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Link, Mail, Search, Check, X } from 'lucide-react';
import { EmailSentLogsDialog } from './EmailSentLogsDialog';

interface CollectPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  booking?: {
    id: number;
    total_cost: number;
    cleaning_type: string;
    address: string;
  };
  onPaymentMethodsUpdated?: () => void;
}

export const CollectPaymentMethodDialog: React.FC<CollectPaymentMethodDialogProps> = ({
  open,
  onOpenChange,
  customer,
  booking,
  onPaymentMethodsUpdated
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'search' | 'collect_only' | 'payment_link' | 'preview'>('search');
  const [amount, setAmount] = useState(booking?.total_cost?.toString() || '');
  const [description, setDescription] = useState(
    booking ? `${booking.cleaning_type} - ${booking.address}` : 'Cleaning Service Payment'
  );
  const [collectForFuture, setCollectForFuture] = useState(true);
  const [searching, setSearching] = useState(false);
  const [stripeCustomers, setStripeCustomers] = useState<any[]>([]);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [emailPreview, setEmailPreview] = useState<{subject: string, content: string} | null>(null);
  const [showEmailLogs, setShowEmailLogs] = useState(false);

  const handleSearchStripe = async () => {
    setSearching(true);
    setSearchCompleted(false);
    try {
      const { data, error } = await supabase.functions.invoke('search-stripe-customer', {
        body: {
          customerId: customer.id,
          email: customer.email
        }
      });

      if (error) throw error;

      setStripeCustomers(data.customers || []);
      setSearchCompleted(true);
      
      if (data.customers?.length > 0) {
        toast({
          title: 'Search Complete',
          description: `Found ${data.customers.length} existing Stripe customer(s) with ${data.customers.reduce((total: number, c: any) => total + c.new_payment_methods, 0)} new payment methods available to import.`,
        });
      } else {
        toast({
          title: 'No Existing Customers Found',
          description: 'No existing Stripe customers found for this email. You can collect a new payment method.',
        });
      }
    } catch (error: any) {
      console.error('Error searching Stripe:', error);
      toast({
        title: 'Search Error',
        description: error.message || 'Failed to search Stripe customers',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleImportPaymentMethods = async (stripeCustomerId: string, paymentMethods: any[]) => {
    setLoading(true);
    try {
      const newMethods = paymentMethods.filter(pm => !pm.already_imported);
      const paymentMethodIds = newMethods.map(pm => pm.id);
      
      if (paymentMethodIds.length === 0) {
        toast({
          title: 'No New Payment Methods',
          description: 'All payment methods have already been imported.',
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.functions.invoke('import-stripe-payment-methods', {
        body: {
          customerId: customer.id,
          stripeCustomerId,
          paymentMethodIds: paymentMethodIds,
          setFirstAsDefault: false
        }
      });

      if (error) {
        console.error('Failed to import payment methods:', error);
        throw new Error(error.message || 'Failed to import payment methods');
      }

      toast({
        title: 'Payment Methods Imported',
        description: `Successfully imported ${paymentMethodIds.length} payment method(s) for ${customer.first_name} ${customer.last_name}.`,
      });
      
      // Refresh the customer data to show updated payment method status
      if (onPaymentMethodsUpdated) {
        onPaymentMethodsUpdated();
      }
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error importing payment methods:', error);
      toast({
        title: 'Import Error',
        description: error.message || 'Failed to import payment methods',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCollectPaymentMethod = async () => {
    console.log('handleCollectPaymentMethod called', { customer, mode });
    // First show email preview
    await showEmailPreview();
  };

  const showEmailPreview = async () => {
    console.log('showEmailPreview called', { customer, mode, booking });
    try {
      setLoading(true);
      
      // Get the email template
      const { data: template, error } = await supabase
        .from('email_notification_templates')
        .select('*')
        .eq('name', 'payment_method_collection')
        .eq('is_active', true)
        .single();

      if (error) throw error;

      if (!template) {
        toast({
          title: 'Error',
          description: 'Payment method collection email template not found',
          variant: 'destructive',
        });
        return;
      }

      // Prepare email variables based on mode
      const isCollectOnly = mode === 'collect_only';
      const variables = {
        customer_name: `${customer.first_name} ${customer.last_name}`.trim(),
        has_booking_data: !isCollectOnly && booking ? 'true' : '',
        booking_date: !isCollectOnly && booking ? new Date().toLocaleDateString('en-GB', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) : '',
        address: !isCollectOnly && booking?.address ? booking.address : '',
        total_cost: !isCollectOnly && booking?.total_cost ? booking.total_cost.toString() : '',
        payment_link: '[Secure Payment Link - will be generated when sent]'
      };

      // Replace variables in subject and content
      let previewSubject = template.subject;
      let previewContent = template.html_content;
      
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        previewSubject = previewSubject.replace(regex, value);
        previewContent = previewContent.replace(regex, value);
      });

      // Handle handlebars conditionals for preview
      if (!variables.has_booking_data) {
        // Remove the booking details section for collect-only mode
        previewContent = previewContent.replace(/{{#if has_booking_data}}[\s\S]*?{{\/if}}/g, '');
        previewContent = previewContent.replace(/{{#unless has_booking_data}}/g, '');
        previewContent = previewContent.replace(/{{\/unless}}/g, '');
      } else {
        // Remove the unless section for booking mode
        previewContent = previewContent.replace(/{{#unless has_booking_data}}[\s\S]*?{{\/unless}}/g, '');
        previewContent = previewContent.replace(/{{#if has_booking_data}}/g, '');
        previewContent = previewContent.replace(/{{\/if}}/g, '');
      }

      setEmailPreview({
        subject: previewSubject,
        content: previewContent
      });
      
      setMode('preview');
    } catch (error: any) {
      console.error('Error preparing email preview:', error);
      toast({
        title: 'Error',
        description: 'Failed to prepare email preview',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmAndSendEmail = async () => {
    setLoading(true);
    try {
    const { data, error } = await supabase.functions.invoke('stripe-collect-payment-method', {
      body: {
        customer_id: customer.id,
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`.trim(),
        return_url: `https://account.sncleaningservices.co.uk/auth?payment_setup=success&redirect=customer`,
        booking_details: booking ? {
          address: booking.address,
          total_cost: booking.total_cost,
          cleaning_type: booking.cleaning_type
        } : null,
        collect_only: mode === 'collect_only', // Add flag to distinguish collect-only vs payment with booking
        send_email: true
      }
    });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Email Sent Successfully',
          description: `Payment method collection email sent to ${customer.email}. Customer can securely add their card details.`,
        });
        
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error collecting payment method:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send payment method collection email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPaymentLink = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Generate the payment link
      const { data: linkData, error: linkError } = await supabase.functions.invoke('stripe-send-payment-link', {
        body: {
          customer_id: customer.id,
          email: customer.email,
          name: `${customer.first_name} ${customer.last_name}`.trim(),
          amount: parseFloat(amount),
          description,
          booking_id: booking?.id,
          collect_payment_method: collectForFuture
        }
      });

      if (linkError) throw linkError;

      if (!linkData.payment_link_url) {
        throw new Error('No payment link URL returned');
      }

      // Send email with the payment link
      const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
        body: {
          recipient_email: customer.email,
          recipient_name: `${customer.first_name} ${customer.last_name}`.trim(),
          custom_subject: `Cleaning Services Invoice - £${amount}`,
          custom_content: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background-color: #fafafa; padding: 40px 20px;">
              <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 32px;">
                  <h1 style="color: hsl(180, 75%, 37%); margin: 0; font-size: 28px;">SN Cleaning Services</h1>
                </div>
                
                <h2 style="color: hsl(196, 62%, 25%); font-size: 24px; margin-bottom: 16px;">Cleaning Services Invoice</h2>
                
                <p style="color: hsl(210, 20%, 15%); font-size: 16px; line-height: 1.6;">Dear ${customer.first_name},</p>
                
                <p style="color: hsl(210, 20%, 15%); font-size: 16px; line-height: 1.6;">Please complete your payment of <strong style="color: hsl(180, 75%, 37%);">£${amount}</strong> for the following service:</p>
                
                <div style="background-color: hsl(0, 0%, 96%); border-left: 4px solid hsl(180, 75%, 37%); padding: 16px; margin: 24px 0; border-radius: 4px;">
                  <p style="margin: 0; color: hsl(210, 20%, 15%); font-size: 15px;"><strong>Service:</strong> ${description}</p>
                </div>
                
                ${collectForFuture ? `
                  <div style="background-color: hsl(180, 75%, 95%); border: 1px solid hsl(180, 75%, 37%); border-radius: 8px; padding: 20px; margin: 24px 0;">
                    <p style="margin: 0 0 12px 0; color: hsl(196, 62%, 25%); font-size: 15px; font-weight: 600;">✨ Automated Payment System</p>
                    <p style="margin: 0; color: hsl(210, 20%, 15%); font-size: 14px; line-height: 1.6;">We've upgraded to automated payments! Your card details will be securely saved. For future bookings, we'll place a hold on your card 24 hours before the service and charge it after the service is completed.</p>
                  </div>
                ` : ''}
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${linkData.payment_link_url}" style="background-color: hsl(180, 75%, 37%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">Complete Payment</a>
                </div>
                
                <p style="color: hsl(210, 15%, 35%); font-size: 13px; text-align: center; margin: 20px 0;">Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background-color: hsl(0, 0%, 96%); padding: 12px; border-radius: 4px; font-size: 12px; color: hsl(210, 20%, 15%);">${linkData.payment_link_url}</p>
                
                <hr style="border: none; border-top: 1px solid hsl(0, 0%, 87%); margin: 32px 0;">
                
                <p style="color: hsl(210, 15%, 35%); font-size: 14px; line-height: 1.6;">If you have any questions, please don't hesitate to contact us.</p>
                
                <p style="color: hsl(210, 20%, 15%); font-size: 14px; margin-top: 24px;">Best regards,<br><strong style="color: hsl(180, 75%, 37%);">SN Cleaning Services Team</strong></p>
              </div>
              
              <p style="text-align: center; color: hsl(210, 15%, 35%); font-size: 12px; margin-top: 24px;">© 2024 SN Cleaning Services. All rights reserved.</p>
            </div>
          `
        }
      });

      if (emailError) throw emailError;

      toast({
        title: 'Payment Email Sent',
        description: `Service payment of £${amount} emailed to ${customer.email}${collectForFuture ? '. Automated payments enabled.' : ''}.`,
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending payment link:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send payment link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Collect Payment Method
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium">{customer.first_name} {customer.last_name}</p>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Button
              variant={mode === 'search' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('search')}
            >
              <Search className="h-4 w-4 mr-1" />
              Search Stripe
            </Button>
            <Button
              variant={mode === 'collect_only' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('collect_only')}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Collect New
            </Button>
            <Button
              variant={mode === 'payment_link' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('payment_link')}
            >
              <Link className="h-4 w-4 mr-1" />
              Payment Link
            </Button>
            {mode === 'preview' && (
              <Button
                variant="default"
                size="sm"
                disabled
              >
                📧 Email Preview
              </Button>
            )}
          </div>

          {mode === 'search' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Search for existing Stripe customers and import their saved payment methods instead of asking them to re-enter details.
                </p>
              </div>
              
              <Button
                onClick={handleSearchStripe}
                disabled={searching}
                className="w-full"
              >
                <Search className={`h-4 w-4 mr-2 ${searching ? 'animate-spin' : ''}`} />
                {searching ? 'Searching Stripe...' : `Search in Stripe for ${customer.first_name} ${customer.last_name}`}
              </Button>

              {searchCompleted && stripeCustomers.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No existing Stripe customers found for this email.</p>
                  <p className="text-sm">Use "Collect New" to create a new payment method.</p>
                </div>
              )}

              {stripeCustomers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Found Existing Stripe Customers:</h4>
                  {stripeCustomers.map((stripeCustomer, index) => (
                    <div key={stripeCustomer.stripe_customer_id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{stripeCustomer.name || 'No name'}</p>
                          <p className="text-sm text-muted-foreground">{stripeCustomer.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Customer ID: {stripeCustomer.stripe_customer_id}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p>{stripeCustomer.total_payment_methods} total methods</p>
                          <p className="text-green-600">{stripeCustomer.new_payment_methods} new available</p>
                        </div>
                      </div>
                      
                      {stripeCustomer.payment_methods.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Payment Methods:</p>
                          {stripeCustomer.payment_methods.map((pm: any) => (
                            <div key={pm.id} className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded">
                              <span>**** **** **** {pm.last4} ({pm.brand.toUpperCase()}) {pm.exp_month}/{pm.exp_year}</span>
                              {pm.already_imported ? (
                                <span className="text-green-600 flex items-center gap-1">
                                  <Check className="h-3 w-3" />
                                  Already imported
                                </span>
                              ) : (
                                <span className="text-blue-600">Available to import</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {stripeCustomer.new_payment_methods > 0 && (
                        <Button
                          onClick={() => handleImportPaymentMethods(stripeCustomer.stripe_customer_id, stripeCustomer.payment_methods)}
                          disabled={loading}
                          size="sm"
                          className="w-full"
                        >
                          {loading ? 'Importing...' : `Import ${stripeCustomer.new_payment_methods} Payment Method(s)`}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === 'payment_link' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (£)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Payment description"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Also collect payment method for future use</Label>
                  <p className="text-xs text-muted-foreground">
                    Customer will also set up their card for future payments
                  </p>
                </div>
                <Switch
                  checked={collectForFuture}
                  onCheckedChange={setCollectForFuture}
                />
              </div>
            </>
          )}

          {mode === 'preview' && emailPreview && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  📧 Email Preview - Review the email before sending
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Subject:</Label>
                  <div className="bg-muted p-2 rounded text-sm mt-1">
                    {emailPreview.subject}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Email Content:</Label>
                  <div className="bg-muted p-3 rounded text-sm mt-1 max-h-64 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: emailPreview.content }} />
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setMode('collect_only')}
                  className="flex-1"
                >
                  ← Back to Edit
                </Button>
                <Button
                  onClick={confirmAndSendEmail}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Sending...' : '✓ Send Email'}
                </Button>
              </div>
            </div>
          )}

          {mode !== 'preview' && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={
                  mode === 'collect_only' ? handleCollectPaymentMethod : 
                  mode === 'payment_link' ? handleSendPaymentLink : 
                  handleSearchStripe
                }
                disabled={loading || searching || (mode === 'search' && !searchCompleted && stripeCustomers.length === 0)}
                className="flex-1"
              >
                {loading || searching ? (
                  'Processing...'
                ) : mode === 'collect_only' ? (
                  <>
                    <CreditCard className="h-4 w-4 mr-1" />
                    Collect Card
                  </>
                ) : mode === 'payment_link' ? (
                  <>
                    <Mail className="h-4 w-4 mr-1" />
                    Send Payment Link
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-1" />
                    Search Stripe
                  </>
                )}
              </Button>
            </div>
          )}

          {mode !== 'preview' && (
            <div className="text-xs text-muted-foreground space-y-1">
              {mode === 'payment_link' ? (
                <>
                  <p>• Payment link will be emailed to the customer</p>
                  <p>• Customer clicks the link to pay securely via Stripe</p>
                  {collectForFuture && <p>• Card will be saved for future authorized payments</p>}
                </>
              ) : (
                <>
                  <p>• Payment method collection link sent via email</p>
                  <p>• Customer enters card details securely via Stripe</p>
                  <p>• Card is saved for future authorized payments</p>
                </>
              )}
              <p>• 
                <button 
                  onClick={() => setShowEmailLogs(true)}
                  className="text-blue-600 hover:underline"
                >
                  View email history for this customer
                </button>
              </p>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Email Logs Dialog */}
      <EmailSentLogsDialog
        open={showEmailLogs}
        onOpenChange={setShowEmailLogs}
        customerEmail={customer.email}
      />
    </Dialog>
  );
};