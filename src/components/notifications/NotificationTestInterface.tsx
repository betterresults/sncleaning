import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, TestTube, Eye } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  variables: any; // Json type from Supabase
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Booking {
  id: number;
  date_time: string;
  service_type: string;
  address: string;
  total_cost: number;
  customer: number;
}

export const NotificationTestInterface = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [testEmail, setTestEmail] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      generatePreview();
    }
  }, [selectedTemplate, variables]);

  const fetchData = async () => {
    try {
      const [templatesResult, customersResult, bookingsResult] = await Promise.all([
        supabase
          .from('email_notification_templates')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true }),
        supabase
          .from('customers')
          .select('id, first_name, last_name, email')
          .limit(20)
          .order('created_at', { ascending: false }),
        supabase
          .from('bookings')
          .select('id, date_time, service_type, address, total_cost, customer')
          .limit(10)
          .order('date_time', { ascending: false })
      ]);

      if (templatesResult.error) throw templatesResult.error;
      if (customersResult.error) throw customersResult.error;
      if (bookingsResult.error) throw bookingsResult.error;

      setTemplates((templatesResult.data || []).map(template => ({
        ...template,
        variables: Array.isArray(template.variables) ? template.variables : []
      })));
      setCustomers(customersResult.data || []);
      setBookings(bookingsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch test data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    let content = template.html_content;
    let subject = template.subject;

    // Replace variables in content and subject
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value || `{{${key}}}`);
      subject = subject.replace(regex, value || `{{${key}}}`);
    });

    setPreviewContent(content);
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(templateId);
    
    if (template) {
      // Initialize variables with empty values
      const initialVariables: Record<string, string> = {};
      template.variables.forEach(variable => {
        initialVariables[variable] = '';
      });
      setVariables(initialVariables);
    }
  };

  const loadSampleData = (bookingId?: string) => {
    const booking = bookings.find(b => b.id.toString() === bookingId) || bookings[0];
    const customer = customers.find(c => c.id === booking?.customer) || customers[0];

    if (!booking || !customer) return;

    const sampleVariables = {
      customer_name: `${customer.first_name} ${customer.last_name}`,
      customer_first_name: customer.first_name,
      customer_last_name: customer.last_name,
      customer_email: customer.email,
      booking_date: new Date(booking.date_time).toLocaleDateString(),
      booking_time: new Date(booking.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      service_type: booking.service_type || 'Standard Cleaning',
      address: booking.address || 'Sample Address',
      total_cost: booking.total_cost?.toString() || '0',
      booking_id: booking.id.toString(),
      photos_link: `${window.location.origin}/customer-photos?booking=${booking.id}`,
    };

    setVariables(prev => ({ ...prev, ...sampleVariables }));
    setTestEmail(customer.email);
  };

  const sendTestEmail = async () => {
    if (!selectedTemplate || !testEmail) {
      toast({
        title: "Error",
        description: "Please select a template and enter a test email",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          template_id: selectedTemplate,
          recipient_email: testEmail,
          variables: variables,
          is_test: true,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test email sent successfully!",
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading test interface...</div>;
  }

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Configuration Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Configuration
            </CardTitle>
            <CardDescription>
              Configure and send test emails to verify your templates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="template">Select Template</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template to test" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="test_email">Test Email Address</Label>
              <Input
                id="test_email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email to send test to"
              />
            </div>

            {bookings.length > 0 && (
              <div>
                <Label>Load Sample Data</Label>
                <Select onValueChange={loadSampleData}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a booking for sample data" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings.map((booking) => {
                      const customer = customers.find(c => c.id === booking.customer);
                      return (
                        <SelectItem key={booking.id} value={booking.id.toString()}>
                          {customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown'} - {new Date(booking.date_time).toLocaleDateString()}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedTemplateData && selectedTemplateData.variables.length > 0 && (
              <div>
                <Label>Template Variables</Label>
                <div className="space-y-2 mt-2">
                  {selectedTemplateData.variables.map((variable) => (
                    <div key={variable}>
                      <Label htmlFor={variable} className="text-sm">
                        {variable}
                      </Label>
                      <Input
                        id={variable}
                        value={variables[variable] || ''}
                        onChange={(e) => setVariables(prev => ({ ...prev, [variable]: e.target.value }))}
                        placeholder={`Enter value for ${variable}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={sendTestEmail} 
              disabled={!selectedTemplate || !testEmail || sending}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send Test Email'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Email Preview
            </CardTitle>
            <CardDescription>
              Preview how your email will look to recipients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTemplateData ? (
              <div className="space-y-4">
                <div>
                  <Label>Subject Line</Label>
                  <div className="mt-1 p-2 bg-muted rounded text-sm">
                    {selectedTemplateData.subject.replace(/{{(\w+)}}/g, (match, key) => variables[key] || match)}
                  </div>
                </div>

                <div>
                  <Label>Template Variables Used</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTemplateData.variables.map((variable) => (
                      <Badge key={variable} variant="outline">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Email Content</Label>
                  <div 
                    className="mt-1 p-4 bg-muted rounded border max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select a template to see the preview
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};