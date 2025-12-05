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
import { Send, TestTube, Eye, Search, Calendar } from "lucide-react";

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
  cleaner?: number;
}

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
}

export const NotificationTestInterface = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [bookingSearch, setBookingSearch] = useState('');
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
      const [templatesResult, customersResult, bookingsResult, cleanersResult] = await Promise.all([
        supabase
          .from('email_notification_templates')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true }),
        supabase
          .from('customers')
          .select('id, first_name, last_name, email')
          .order('created_at', { ascending: false }),
        supabase
          .from('bookings')
          .select('id, date_time, service_type, address, total_cost, customer, cleaner')
          .order('date_time', { ascending: false })
          .limit(100),
        supabase
          .from('cleaners')
          .select('id, first_name, last_name')
      ]);

      if (templatesResult.error) throw templatesResult.error;
      if (customersResult.error) throw customersResult.error;
      if (bookingsResult.error) throw bookingsResult.error;
      if (cleanersResult.error) throw cleanersResult.error;

      setTemplates((templatesResult.data || []).map(template => ({
        ...template,
        variables: Array.isArray(template.variables) ? template.variables : []
      })));
      setCustomers(customersResult.data || []);
      setBookings(bookingsResult.data || []);
      setCleaners(cleanersResult.data || []);
      
      console.log('Fetched data:');
      console.log('Bookings:', bookingsResult.data);
      console.log('Cleaners:', cleanersResult.data);
      console.log('Customers:', customersResult.data);
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

    console.log('Generating preview with variables:', variables);
    console.log('Template content before processing:', content);

    // Process Handlebars conditionals first
    const hasBookingData = variables.booking_date || variables.address || variables.total_cost;
    
    // Handle {{#if has_booking_data}} block
    if (hasBookingData) {
      content = content.replace(/\{\{#if has_booking_data\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
      content = content.replace(/\{\{#unless has_booking_data\}\}[\s\S]*?\{\{\/unless\}\}/g, '');
    } else {
      content = content.replace(/\{\{#if has_booking_data\}\}[\s\S]*?\{\{\/if\}\}/g, '');
      content = content.replace(/\{\{#unless has_booking_data\}\}([\s\S]*?)\{\{\/unless\}\}/g, '$1');
    }
    
    // Handle individual field conditionals properly
    ['booking_date', 'address', 'total_cost', 'customer_name', 'payment_link'].forEach(field => {
      if (variables[field]) {
        content = content.replace(new RegExp(`\\{\\{#if ${field}\\}\\}([\\s\\S]*?)\\{\\{\\/if\\}\\}`, 'g'), '$1');
      } else {
        content = content.replace(new RegExp(`\\{\\{#if ${field}\\}\\}[\\s\\S]*?\\{\\{\\/if\\}\\}`, 'g'), '');
      }
    });

    // Replace variables in content and subject - ensure temp_password is always "TempPass123!"
    const processedVariables: Record<string, string> = {
      ...variables,
      temp_password: 'TempPass123!', // Always use this password
    };
    
    // Ensure email is properly mapped from customer_email
    if (variables.customer_email) {
      processedVariables.email = variables.customer_email;
    }

    console.log('Final processed variables before replacement:', processedVariables);

    Object.entries(processedVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(regex, value || '');
      subject = subject.replace(regex, value || '');
    });

    console.log('Template content after processing:', content);
    console.log('Variables used:', processedVariables);

    setPreviewContent(content);
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(templateId);
    
    if (template) {
      // Initialize variables with default values
      const initialVariables: Record<string, string> = {};
      template.variables.forEach(variable => {
        switch (variable) {
          case 'customer_name':
            initialVariables[variable] = 'Sample Customer';
            break;
          case 'customer_first_name':
            initialVariables[variable] = 'Sample';
            break;
          case 'customer_last_name':
            initialVariables[variable] = 'Customer';
            break;
          case 'customer_email':
            initialVariables[variable] = 'sample@example.com';
            break;
          case 'booking_date':
            initialVariables[variable] = new Date().toLocaleDateString();
            break;
          case 'booking_time':
            initialVariables[variable] = '10:00 AM';
            break;
          case 'service_type':
            initialVariables[variable] = 'Domestic Cleaning';
            break;
          case 'address':
            initialVariables[variable] = 'Sample Address';
            break;
          case 'cleaner_name':
            initialVariables[variable] = 'To be assigned';
            break;
          case 'total_cost':
            initialVariables[variable] = '50';
            break;
          case 'booking_id':
            initialVariables[variable] = '12345';
            break;
          case 'photos_link':
            initialVariables[variable] = `${window.location.origin}/customer-photos`;
            break;
          default:
            initialVariables[variable] = `Sample ${variable}`;
        }
      });
      setVariables(initialVariables);
      console.log('Template variables initialized:', initialVariables);
    }
  };

  const loadSampleData = (bookingId?: string) => {
    console.log('Loading sample data for booking ID:', bookingId);
    const booking = bookings.find(b => b.id.toString() === bookingId) || bookings[0];
    const customer = customers.find(c => c.id === booking?.customer) || customers[0];
    
    console.log('Selected booking:', booking);
    console.log('Selected customer:', customer);
    console.log('Booking cleaner field:', booking?.cleaner);
    
    if (!booking || !customer) return;

    setSelectedBooking(bookingId || '');

    // Format service type properly
    const formatServiceType = (serviceType: string) => {
      switch (serviceType) {
        case 'Domestic': return 'Domestic Cleaning';
        case 'Air BnB': return 'Airbnb Cleaning'; 
        case 'Standard Cleaning': return 'Standard Cleaning';
        default: return serviceType || 'Cleaning Service';
      }
    };

    const actualVariables = {
      customer_name: `${customer.first_name} ${customer.last_name}`,
      customer_first_name: customer.first_name,
      customer_last_name: customer.last_name,
      customer_email: customer.email,
      booking_date: new Date(booking.date_time).toLocaleDateString(),
      booking_time: new Date(booking.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      service_type: formatServiceType(booking.service_type),
      address: booking.address || 'Address not specified',
      total_cost: booking.total_cost?.toString() || '0',
      booking_id: booking.id.toString(),
      photos_link: `${window.location.origin}/customer-photos?booking=${booking.id}`,
    };

    // Replace all variables with actual booking data
    setVariables(actualVariables);
    setTestEmail(customer.email);
    
    console.log('Final variables set:', actualVariables);
  };

  // Filter bookings based on search
  const filteredBookings = bookings.filter(booking => {
    if (!bookingSearch.trim()) return true;
    const customer = customers.find(c => c.id === booking.customer);
    const searchLower = bookingSearch.toLowerCase();
    return (
      booking.id.toString().includes(searchLower) ||
      customer?.first_name?.toLowerCase().includes(searchLower) ||
      customer?.last_name?.toLowerCase().includes(searchLower) ||
      customer?.email?.toLowerCase().includes(searchLower) ||
      booking.address?.toLowerCase().includes(searchLower) ||
      new Date(booking.date_time).toLocaleDateString().includes(searchLower)
    );
  });

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
      // Debug: Log the variables being sent
      console.log('Sending variables:', variables);
      
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
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Select Booking
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, customer name, email, or date..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedBooking} onValueChange={loadSampleData}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a booking to send notification for" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {filteredBookings.slice(0, 50).map((booking) => {
                      const customer = customers.find(c => c.id === booking.customer);
                      return (
                        <SelectItem key={booking.id} value={booking.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              #{booking.id} - {customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(booking.date_time).toLocaleDateString()} - {booking.address?.substring(0, 30)}...
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                    {filteredBookings.length === 0 && (
                      <div className="py-2 px-3 text-sm text-muted-foreground">
                        No bookings found
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {selectedBooking && (
                  <p className="text-xs text-muted-foreground">
                    Booking data will be used to populate the template variables
                  </p>
                )}
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
                  <div className="mt-1 border rounded-md bg-white">
                    <div className="p-4 bg-muted text-xs font-medium border-b">
                      Email Preview (as recipient will see it)
                    </div>
                    <div className="max-h-96 overflow-y-auto p-4">
                      <div 
                        className="email-preview-content"
                        dangerouslySetInnerHTML={{ __html: previewContent }}
                        style={{
                          fontFamily: 'Arial, sans-serif',
                          lineHeight: '1.6',
                          color: '#333',
                          maxWidth: '600px'
                        }}
                      />
                    </div>
                  </div>
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