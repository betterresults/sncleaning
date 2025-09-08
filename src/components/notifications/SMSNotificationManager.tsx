import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, Phone, Users, Clock, FileText, Wand2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SMSRecipient {
  id: string;
  name: string;
  phone: string;
  type: 'customer' | 'cleaner';
}

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

const SMSNotificationManager = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [recipients, setRecipients] = useState<SMSRecipient[]>([]);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sendMode, setSendMode] = useState<'individual' | 'bulk'>('individual');

  // Load recipients (customers and cleaners with phone numbers)
  const loadRecipients = async () => {
    try {
      // Get customers with phone numbers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, first_name, last_name, phone')
        .not('phone', 'is', null)
        .neq('phone', '');

      if (customersError) throw customersError;

      // Get cleaners with phone numbers  
      const { data: cleaners, error: cleanersError } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name, phone')
        .not('phone', 'is', null)
        .neq('phone', 0);

      if (cleanersError) throw cleanersError;

      const customerRecipients: SMSRecipient[] = (customers || []).map(customer => ({
        id: `customer_${customer.id}`,
        name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unnamed Customer',
        phone: customer.phone,
        type: 'customer'
      }));

      const cleanerRecipients: SMSRecipient[] = (cleaners || []).map(cleaner => ({
        id: `cleaner_${cleaner.id}`,
        name: `${cleaner.first_name || ''} ${cleaner.last_name || ''}`.trim() || 'Unnamed Cleaner',
        phone: cleaner.phone?.toString() || '',
        type: 'cleaner'
      }));

      setRecipients([...customerRecipients, ...cleanerRecipients]);
    } catch (error) {
      console.error('Error loading recipients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load SMS recipients',
        variant: 'destructive'
      });
    }
  };

  // Load SMS templates
  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('id, name, content, variables')
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
      console.error('Error loading SMS templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load SMS templates',
        variant: 'destructive'
      });
    }
  };

  React.useEffect(() => {
    loadRecipients();
    loadTemplates();
  }, []);

  const sendSMS = async (to: string, recipientName?: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-sms-notification', {
        body: {
          to: to,
          message: message
        }
      });

      if (error) throw error;

      toast({
        title: 'SMS Sent',
        description: `Message sent successfully${recipientName ? ` to ${recipientName}` : ''}`,
      });

      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: 'SMS Failed',
        description: `Failed to send SMS${recipientName ? ` to ${recipientName}` : ''}: ${error.message}`,
        variant: 'destructive'
      });
      return false;
    }
  };

  const handleSendSMS = async () => {
    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      if (sendMode === 'individual') {
        if (!phoneNumber.trim()) {
          toast({
            title: 'Error',
            description: 'Please enter a phone number',
            variant: 'destructive'
          });
          return;
        }
        
        await sendSMS(phoneNumber);
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
            const success = await sendSMS(recipient.phone, recipient.name);
            if (success) {
              successCount++;
            } else {
              failCount++;
            }
            // Add small delay between messages
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        toast({
          title: 'Bulk SMS Complete',
          description: `${successCount} messages sent successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
        });
      }

      // Clear form after successful send
      setMessage('');
      setPhoneNumber('');
      setSelectedClient('');
      setSelectedRecipients([]);
      setSelectedTemplate('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessage(template.content);
      setSelectedTemplate(templateId);
    }
  };

  const handleClientSelect = (clientId: string) => {
    const client = recipients.find(r => r.id === clientId);
    if (client) {
      setPhoneNumber(client.phone);
      setSelectedClient(clientId);
    } else {
      setSelectedClient('');
    }
  };

  const clearTemplate = () => {
    setSelectedTemplate('');
    setMessage('');
  };

  const toggleRecipient = (recipientId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(recipientId) 
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const selectAllByType = (type: 'customer' | 'cleaner') => {
    const typeRecipients = recipients.filter(r => r.type === type).map(r => r.id);
    setSelectedRecipients(prev => [...new Set([...prev, ...typeRecipients])]);
  };

  const messageLength = message.length;
  const smsCount = Math.ceil(messageLength / 160);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Notification Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Send Mode Selection */}
          <div className="space-y-2">
            <Label htmlFor="send-mode">Send Mode</Label>
            <Select value={sendMode} onValueChange={(value: 'individual' | 'bulk') => setSendMode(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Individual Number
                  </div>
                </SelectItem>
                <SelectItem value="bulk">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Bulk Send to Recipients
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sendMode === 'individual' ? (
            <div className="space-y-4">
              {/* Client Selector */}
              <div className="space-y-2">
                <Label htmlFor="client-select">Select Client (Optional)</Label>
                <Select value={selectedClient} onValueChange={handleClientSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client to auto-fill phone number..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Enter phone number manually
                      </div>
                    </SelectItem>
                    {recipients.map((recipient) => (
                      <SelectItem key={recipient.id} value={recipient.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            recipient.type === 'customer' ? 'bg-blue-500' : 'bg-green-500'
                          }`} />
                          {recipient.name} - {recipient.phone}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Phone Number Input */}
              <div className="space-y-2">
                <Label htmlFor="phone-number">Phone Number</Label>
                <Input
                  id="phone-number"
                  type="tel"
                  placeholder="+44 7123 456789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Enter phone number with country code (e.g., +44 for UK) or select a client above
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Select Recipients ({selectedRecipients.length} selected)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => selectAllByType('customer')}
                  >
                    All Customers
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => selectAllByType('cleaner')}
                  >
                    All Cleaners
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRecipients([])}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto border rounded-lg p-4">
                {recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRecipients.includes(recipient.id)
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleRecipient(recipient.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{recipient.name}</p>
                        <p className="text-sm text-muted-foreground">{recipient.phone}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        selectedRecipients.includes(recipient.id)
                          ? 'bg-primary border-primary'
                          : 'border-gray-300'
                      }`} />
                    </div>
                    <div className="mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        recipient.type === 'customer' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {recipient.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {recipients.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No recipients with phone numbers found
                </p>
              )}
            </div>
          )}

          {/* Template Selection */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>SMS Template (Optional)</Label>
              <div className="flex gap-2">
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearTemplate}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {selectedTemplate && (
                <p className="text-sm text-muted-foreground">
                  Template loaded. You can edit the message below before sending.
                </p>
              )}
            </div>
          )}

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your SMS message or select a template above..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{messageLength} characters</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{smsCount} SMS{smsCount > 1 ? 's' : ''}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The exact text above will be sent. You can edit template content before sending.
            </p>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendSMS}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              'Sending...'
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send SMS {sendMode === 'bulk' && selectedRecipients.length > 0 && 
                  `(${selectedRecipients.length} recipient${selectedRecipients.length > 1 ? 's' : ''})`
                }
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SMSNotificationManager;