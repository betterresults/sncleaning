import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Send, Users, Clock, FileText, Wand2, Check, ChevronsUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useManualEmailNotification } from '@/hooks/useManualEmailNotification';

// Customer Portal Email Template
const CUSTOMER_PORTAL_EMAIL_TEMPLATE = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #185166; margin: 0; font-size: 28px;">Welcome to Your Customer Portal! 🎉</h1>
      <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Manage your bookings and account easily online</p>
    </div>
    
    <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #18A5A5;">
      <h2 style="color: #185166; margin: 0 0 15px 0; font-size: 20px;">Hello {{customer_name}}!</h2>
      <p style="color: #333; margin: 0; line-height: 1.6;">
        Great news! We've set up your customer account so you can manage your cleaning services online. You can now view your bookings, schedule new services, and much more!
      </p>
    </div>

    <div style="background-color: #fff; border: 2px solid #18A5A5; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
      <h3 style="color: #185166; margin: 0 0 20px 0; font-size: 18px; text-align: center;">🔑 Your Login Details</h3>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
        <strong style="color: #185166; font-size: 16px;">🌐 Website:</strong><br>
        <a href="https://account.sncleaningservices.co.uk" style="color: #18A5A5; text-decoration: none; font-size: 18px; font-weight: bold;">account.sncleaningservices.co.uk</a>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
        <strong style="color: #185166; font-size: 16px;">📧 Email:</strong><br>
        <span style="color: #333; font-size: 16px; font-weight: bold;">{{email}}</span>
      </div>
      
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; border: 2px solid #ffc107;">
        <strong style="color: #856404; font-size: 16px;">🔐 Temporary Password:</strong><br>
        <span style="color: #856404; font-size: 24px; font-weight: bold; font-family: monospace; background-color: white; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 5px;">{{temp_password}}</span>
      </div>
    </div>

    <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #ffc107;">
      <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">🛡️ Important Security Note</h3>
      <p style="color: #856404; margin: 0; line-height: 1.6; font-size: 14px;">
        Please change your password after your first login for security purposes. You can do this in your account settings.
      </p>
    </div>

    <div style="text-align: center; margin-bottom: 25px;">
      <a href="https://account.sncleaningservices.co.uk" style="display: inline-block; background-color: #18A5A5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; box-shadow: 0 2px 10px rgba(24,165,165,0.3);">
        Access Your Account Now →
      </a>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #666; margin: 0; font-size: 14px;">
        Thank you for choosing SN Cleaning Services! ✨
      </p>
      <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">
        We look forward to providing you with exceptional cleaning service.
      </p>
    </div>
  </div>
</div>`;

interface EmailRecipient {
  id: string;
  name: string;
  email: string;
  type: 'customer' | 'cleaner';
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  variables: string[];
}

const EmailNotificationManager = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('manual');
  const [clientComboOpen, setClientComboOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sendMode, setSendMode] = useState<'individual' | 'bulk'>('individual');
  const { sendManualEmail, isLoading: isSending } = useManualEmailNotification();

  // Load recipients (customers and cleaners with email addresses)
  const loadRecipients = async () => {
    try {
      // Get customers with email addresses
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email')
        .not('email', 'is', null)
        .neq('email', '');

      if (customersError) throw customersError;

      // Get cleaners with email addresses  
      const { data: cleaners, error: cleanersError } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name, email')
        .not('email', 'is', null)
        .neq('email', '');

      if (cleanersError) throw cleanersError;

      const customerRecipients: EmailRecipient[] = (customers || []).map(customer => ({
        id: `customer_${customer.id}`,
        name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unnamed Customer',
        email: customer.email,
        type: 'customer'
      }));

      const cleanerRecipients: EmailRecipient[] = (cleaners || []).map(cleaner => ({
        id: `cleaner_${cleaner.id}`,
        name: `${cleaner.first_name || ''} ${cleaner.last_name || ''}`.trim() || 'Unnamed Cleaner',
        email: cleaner.email || '',
        type: 'cleaner'
      }));

      setRecipients([...customerRecipients, ...cleanerRecipients]);
    } catch (error) {
      console.error('Error loading recipients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email recipients',
        variant: 'destructive'
      });
    }
  };

  // Load email templates
  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_notification_templates')
        .select('id, name, subject, html_content, variables')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Cast variables from Json to string[]
      const templatesWithTypedVariables = (data || []).map(template => ({
        ...template,
        variables: Array.isArray(template.variables) ? template.variables as string[] : []
      }));

      setTemplates(templatesWithTypedVariables);
    } catch (error) {
      console.error('Error loading email templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email templates',
        variant: 'destructive'
      });
    }
  };

  React.useEffect(() => {
    loadRecipients();
    loadTemplates();
  }, []);

  const handleSendEmail = async () => {
    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive'
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a subject',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      if (sendMode === 'individual') {
        if (!emailAddress.trim()) {
          toast({
            title: 'Error',
            description: 'Please enter an email address',
            variant: 'destructive'
          });
          return;
        }
        
        // Send individual email using existing notification system
        await supabase.functions.invoke('send-notification-email', {
          body: {
            to: [emailAddress],
            subject,
            html: message
          }
        });

        toast({
          title: 'Email Sent',
          description: `Email sent successfully`,
        });
      } else {
        // Bulk send
        if (selectedRecipients.length === 0) {
          toast({
            title: 'Error',
            description: 'Please select at least one recipient',
            variant: 'destructive'
          });
          return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const recipientId of selectedRecipients) {
          const recipient = recipients.find(r => r.id === recipientId);
          if (recipient) {
            try {
              await supabase.functions.invoke('send-notification-email', {
                body: {
                  to: [recipient.email],
                  subject,
                  html: message
                }
              });
              successCount++;
            } catch (error) {
              console.error(`Failed to send email to ${recipient.name}:`, error);
              failCount++;
            }
            // Add small delay between messages
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        toast({
          title: 'Bulk Email Complete',
          description: `${successCount} emails sent successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
        });
      }

      // Clear form after successful send
      setMessage('');
      setSubject('');
      setEmailAddress('');
      setSelectedClient('manual');
      setSelectedRecipients([]);
      setSelectedTemplate('');
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'Email Failed',
        description: `Failed to send email: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processTemplateVariables = (content: string, clientData?: any) => {
    console.log('=== PROCESSING TEMPLATE VARIABLES ===');
    console.log('Content length:', content.length);
    console.log('ClientData provided:', clientData);
    console.log('Selected client from state:', selectedClient);
    console.log('Recipients available:', recipients.length);
    
    let processedContent = content;
    
    // Get selected client data - use provided clientData or find from selectedClient
    const selectedClientData = clientData || (selectedClient !== 'manual' 
      ? recipients.find(r => r.id === selectedClient)
      : null);
    
    console.log('Processing template for client:', selectedClientData);
    
    // Check if this is a payment setup email (no booking data)
    const isPaymentSetup = !selectedClientData?.bookingId;
    
    if (selectedClientData) {
      console.log('FOUND CLIENT DATA - processing variables');
      
      // Replace customer_name
      processedContent = processedContent.replace(
        /\{\{customer_name\}\}/g, 
        selectedClientData.name
      );
      console.log('After customer_name replacement');
      
      // Replace customer email - ensure we have the actual email
      const customerEmail = selectedClientData.email || '';
      console.log('Customer email found:', customerEmail, 'from data:', selectedClientData);
      console.log('Before email replacement - content contains {{email}}:', processedContent.includes('{{email}}'));
      
      processedContent = processedContent.replace(
        /\{\{email\}\}/g, 
        customerEmail
      );
      
      console.log('After email replacement - content contains {{email}}:', processedContent.includes('{{email}}'));
      console.log('Email should now be:', customerEmail);
      
      // Generate payment link using Supabase edge function
      const customerId = selectedClientData.id.replace('customer_', '').replace('cleaner_', '');
      const paymentLink = `https://dkomihipebixlegygnoy.supabase.co/functions/v1/redirect-to-payment-collection?customer_id=${customerId}`;
      
      // Replace payment_link
      processedContent = processedContent.replace(
        /\{\{payment_link\}\}/g, 
        paymentLink
      );
      
      // Replace login_link using your domain
      const loginLink = `https://account.sncleaningservices.co.uk/auth`;
      processedContent = processedContent.replace(
        /\{\{login_link\}\}/g, 
        loginLink
      );
      
      // Set default temporary password as requested
      const tempPassword = "123!";
      console.log('Setting temp_password to:', tempPassword);
      console.log('Before temp_password replacement - content contains {{temp_password}}:', processedContent.includes('{{temp_password}}'));
      
      processedContent = processedContent.replace(
        /\{\{temp_password\}\}/g, 
        tempPassword
      );
      
      console.log('After temp_password replacement - content contains {{temp_password}}:', processedContent.includes('{{temp_password}}'));
    } else {
      console.log('NO CLIENT DATA FOUND - cannot process variables');
    }
    
    console.log('Final processed content contains email placeholder?', processedContent.includes('{{email}}'));
    console.log('Final processed content contains temp_password placeholder?', processedContent.includes('{{temp_password}}'));
    
    // For payment setup emails, remove booking-related sections
    if (isPaymentSetup) {
      // Remove booking-related conditionals
      processedContent = processedContent.replace(/\{\{#if has_booking_data\}\}[\s\S]*?\{\{\/if\}\}/g, '');
      processedContent = processedContent.replace(/\{\{#unless has_booking_data\}\}([\s\S]*?)\{\{\/unless\}\}/g, '$1');
      
      // Remove individual field conditionals for booking data
      ['booking_date', 'address', 'total_cost', 'booking_time', 'service_type', 'cleaner_name'].forEach(field => {
        processedContent = processedContent.replace(new RegExp(`\\{\\{#if ${field}\\}\\}[\\s\\S]*?\\{\\{\\/if\\}\\}`, 'g'), '');
      });
      
      // Clean up any remaining handlebars variables
      processedContent = processedContent.replace(/\{\{[^}]+\}\}/g, '');
    }
    
    return processedContent;
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template && templateId !== 'none') {
      const processedSubject = processTemplateVariables(template.subject);
      const processedContent = processTemplateVariables(template.html_content);
      
      setSubject(processedSubject);
      setMessage(processedContent);
    }
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId);
    
    if (clientId !== 'manual') {
      const client = recipients.find(r => r.id === clientId);
      if (client) {
        setEmailAddress(client.email);
        
        // Re-process template with client data if template is selected
        if (selectedTemplate && selectedTemplate !== 'none') {
          const template = templates.find(t => t.id === selectedTemplate);
          if (template) {
            const processedSubject = processTemplateVariables(template.subject, client);
            const processedContent = processTemplateVariables(template.html_content, client);
            
            setSubject(processedSubject);
            setMessage(processedContent);
          }
        }
      }
    } else {
      setEmailAddress('');
    }
  };

  const toggleRecipientSelection = (recipientId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(recipientId) 
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const selectedClientData = selectedClient !== 'manual' 
    ? recipients.find(r => r.id === selectedClient) 
    : null;

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Sending Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={sendMode} onValueChange={(value: 'individual' | 'bulk') => setSendMode(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual Email</SelectItem>
              <SelectItem value="bulk">Bulk Email</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Email Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template (manual)</SelectItem>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && selectedTemplate !== 'none' && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Template variables: {templates.find(t => t.id === selectedTemplate)?.variables.join(', ') || 'None'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipient Selection */}
      {sendMode === 'individual' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Recipient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Client</Label>
              <Popover open={clientComboOpen} onOpenChange={setClientComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientComboOpen}
                    className="w-full justify-between"
                  >
                    {selectedClientData ? selectedClientData.name : "Manual entry"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search clients..." />
                    <CommandList>
                      <CommandEmpty>No clients found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="manual"
                          onSelect={() => {
                            handleClientSelect('manual');
                            setClientComboOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedClient === 'manual' ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Manual entry
                        </CommandItem>
                        {recipients.map((recipient) => (
                        <CommandItem
                          key={recipient.id}
                          value={`${recipient.name} ${recipient.email} ${recipient.type}`}
                          onSelect={() => {
                            handleClientSelect(recipient.id);
                            setClientComboOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedClient === recipient.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{recipient.name}</span>
                            <span className="text-sm text-muted-foreground">{recipient.email} • {recipient.type}</span>
                          </div>
                        </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="recipient@example.com"
                disabled={selectedClient !== 'manual'}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recipients ({selectedRecipients.length} selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {recipients.map(recipient => (
                <div
                  key={recipient.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedRecipients.includes(recipient.id)
                      ? "bg-primary/10 border-primary"
                      : "bg-background hover:bg-muted"
                  )}
                  onClick={() => toggleRecipientSelection(recipient.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{recipient.name}</p>
                      <p className="text-sm text-muted-foreground">{recipient.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{recipient.type}</p>
                    </div>
                    {selectedRecipients.includes(recipient.id) && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message Composition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Email Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
            />
          </div>

          <div>
            <Label htmlFor="message">Message (HTML supported)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your email message..."
              rows={10}
            />
          </div>

          {selectedTemplate && selectedTemplate !== 'none' && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <Wand2 className="h-4 w-4" />
                <span className="text-sm font-medium">Template Applied</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Variables have been automatically replaced based on selected client.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Button */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleSendEmail} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            <Send className="mr-2 h-4 w-4" />
            {isLoading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              `Send Email${sendMode === 'bulk' ? `s (${selectedRecipients.length})` : ''}`
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailNotificationManager;