import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Send, Plus, X } from 'lucide-react';
import { useManualEmailNotification } from '@/hooks/useManualEmailNotification';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  description: string;
  variables: string[];
}

interface DatabaseEmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  description: string;
  variables: any; // JSON from database
}

interface Booking {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  address: string;
  postcode: string;
  date_time: string;
  service_type: string;
  total_cost: number;
  customers?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface ManualEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
}

const ManualEmailDialog = ({ open, onOpenChange, booking }: ManualEmailDialogProps) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const { toast } = useToast();
  const { sendManualEmail, isLoading: isSending } = useManualEmailNotification();

  useEffect(() => {
    if (open) {
      loadTemplates();
      // Pre-fill with booking customer email
      if (booking.email) {
        setRecipients([booking.email]);
      }
    }
  }, [open, booking]);

  useEffect(() => {
    if (selectedTemplate) {
      // Initialize variables with booking data
      const bookingVariables: Record<string, string> = {
        customer_name: `${booking.first_name || booking.customers?.first_name || ''} ${booking.last_name || booking.customers?.last_name || ''}`.trim() || 'Customer',
        customer_email: booking.email || '',
        booking_date: booking.date_time ? new Date(booking.date_time).toLocaleDateString() : '',
        booking_time: booking.date_time ? new Date(booking.date_time).toLocaleTimeString() : '',
        service_type: booking.service_type || '',
        address: booking.address || '',
        total_cost: booking.total_cost?.toString() || '0',
        temp_password: 'TempPass123!', // Default temporary password - admin can edit
      };

      setVariables(bookingVariables);
      setSubject(selectedTemplate.subject);
      setEmailContent(selectedTemplate.html_content);
    }
  }, [selectedTemplate, booking]);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const { data, error } = await supabase
        .from('email_notification_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      // Transform database data to proper format
      const transformedTemplates: EmailTemplate[] = (data || []).map((template: DatabaseEmailTemplate) => ({
        ...template,
        variables: Array.isArray(template.variables) ? template.variables : JSON.parse(template.variables || '[]')
      }));
      
      setTemplates(transformedTemplates);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const addRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const updateRecipient = (index: number, email: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = email;
    setRecipients(newRecipients);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const replaceVariables = (text: string, vars: Record<string, string>) => {
    let result = text;
    
    // Handle Handlebars conditionals first
    const hasBookingData = vars.booking_date || vars.address || vars.total_cost;
    
    // Handle {{#if has_booking_data}} block
    if (hasBookingData) {
      result = result.replace(/\{\{#if has_booking_data\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
      result = result.replace(/\{\{#unless has_booking_data\}\}[\s\S]*?\{\{\/unless\}\}/g, '');
    } else {
      result = result.replace(/\{\{#if has_booking_data\}\}[\s\S]*?\{\{\/if\}\}/g, '');
      result = result.replace(/\{\{#unless has_booking_data\}\}([\s\S]*?)\{\{\/unless\}\}/g, '$1');
    }
    
    // Handle individual field conditionals
    ['booking_date', 'address', 'total_cost', 'customer_name', 'payment_link'].forEach(field => {
      if (vars[field]) {
        result = result.replace(new RegExp(`\\{\\{#if ${field}\\}\\}([\\s\\S]*?)\\{\\{\\/if\\}\\}`, 'g'), '$1');
      } else {
        result = result.replace(new RegExp(`\\{\\{#if ${field}\\}\\}[\\s\\S]*?\\{\\{\\/if\\}\\}`, 'g'), '');
      }
    });
    
    // Replace simple variables
    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    });
    
    return result;
  };

  const handleSendEmail = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select an email template",
        variant: "destructive",
      });
      return;
    }

    const validRecipients = recipients.filter(email => email && email.includes('@'));
    if (validRecipients.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Send email to each recipient
      for (const recipientEmail of validRecipients) {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            template_id: selectedTemplate.id,
            recipient_email: recipientEmail,
            variables: variables,
            custom_subject: subject !== selectedTemplate.subject ? subject : undefined,
            custom_content: emailContent !== selectedTemplate.html_content ? emailContent : undefined,
          }
        });
      }

      toast({
        title: "Success",
        description: `Email sent to ${validRecipients.length} recipient${validRecipients.length > 1 ? 's' : ''}`,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const previewEmailContent = replaceVariables(emailContent, variables);
  const previewSubject = replaceVariables(subject, variables);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email - Booking #{booking.id}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Template Selection & Settings */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingTemplates ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading templates...
                  </div>
                ) : (
                  <Select
                    value={selectedTemplate?.id || ''}
                    onValueChange={(value) => {
                      const template = templates.find(t => t.id === value);
                      setSelectedTemplate(template || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an email template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{template.name}</span>
                            <span className="text-sm text-muted-foreground">{template.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {selectedTemplate && (
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedTemplate.variables.length} variables available
                    </Badge>
                    <div className="flex flex-wrap gap-1">
                      {selectedTemplate.variables.map((variable) => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recipients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recipients.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="recipient@example.com"
                      value={email}
                      onChange={(e) => updateRecipient(index, e.target.value)}
                      className="flex-1"
                    />
                    {recipients.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRecipient(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addRecipient}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipient
                </Button>
              </CardContent>
            </Card>

            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Variables</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedTemplate.variables.map((variable) => (
                    <div key={variable}>
                      <Label htmlFor={variable} className="text-sm font-medium">
                        {variable.replace(/_/g, ' ')}
                      </Label>
                      <Input
                        id={variable}
                        value={variables[variable] || ''}
                        onChange={(e) => setVariables({
                          ...variables,
                          [variable]: e.target.value
                        })}
                        placeholder={`Enter ${variable.replace(/_/g, ' ').toLowerCase()}`}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Email Preview & Editing */}
          {selectedTemplate && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Subject Line</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject"
                  />
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <strong>Preview:</strong> {previewSubject}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Email Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="Email HTML content"
                    rows={10}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="border rounded p-4 max-h-40 overflow-y-auto text-sm"
                    dangerouslySetInnerHTML={{ __html: previewEmailContent }}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedTemplate ? `Using template: ${selectedTemplate.name}` : 'No template selected'}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={!selectedTemplate || loading || recipients.filter(e => e).length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualEmailDialog;