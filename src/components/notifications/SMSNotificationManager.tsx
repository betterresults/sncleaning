import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, Phone, Users, Clock, FileText, Wand2, Check, ChevronsUpDown, Calendar, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface SMSRecipient {
  id: string;
  name: string;
  phone: string;
  type: 'customer' | 'cleaner';
  customerId?: number;
}

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

interface Booking {
  id: number;
  date_time: string;
  service_type: string;
  cleaning_type: string;
  address: string;
  postcode: string;
  total_cost: number;
  total_hours: number;
  booking_status: string;
  payment_status: string;
  payment_method: string;
  invoice_link: string;
  customer: number;
  cleaner?: number;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  email?: string;
  cleaner_name?: string;
  cleaner_phone?: string;
}

const SMSNotificationManager = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [recipients, setRecipients] = useState<SMSRecipient[]>([]);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('manual');
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [clientComboOpen, setClientComboOpen] = useState(false);
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
        type: 'customer',
        customerId: customer.id
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

  // Load bookings with cleaner info
  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, date_time, service_type, cleaning_type, address, postcode, 
          total_cost, total_hours, booking_status, payment_status, payment_method,
          invoice_link, customer, cleaner, first_name, last_name, phone_number, email,
          cleaners (first_name, last_name, phone)
        `)
        .order('date_time', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Map the data to include cleaner name and phone
      const bookingsWithCleaner = (data || []).map(booking => ({
        ...booking,
        cleaner_name: booking.cleaners ? 
          `${booking.cleaners.first_name || ''} ${booking.cleaners.last_name || ''}`.trim() : undefined,
        cleaner_phone: booking.cleaners?.phone?.toString()
      }));
      
      setBookings(bookingsWithCleaner);
    } catch (error) {
      console.error('Error loading bookings:', error);
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
    loadBookings();
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
      setSelectedClient('manual');
      setSelectedRecipients([]);
      setSelectedTemplate('');
    } finally {
      setIsLoading(false);
    }
  };

  const processTemplateVariables = (content: string, clientData?: any, bookingData?: Booking) => {
    let processedContent = content;
    
    // Get selected client data - use provided clientData or find from selectedClient
    const selectedClientData = clientData || (selectedClient !== 'manual' 
      ? recipients.find(r => r.id === selectedClient)
      : null);
    
    // Get selected booking data
    const booking = bookingData || (selectedBooking 
      ? bookings.find(b => b.id.toString() === selectedBooking)
      : null);
    
    // === CUSTOMER VARIABLES ===
    if (selectedClientData) {
      processedContent = processedContent.replace(/\{\{customer_name\}\}/g, selectedClientData.name);
      
      // Split name for first_name and last_name
      const nameParts = selectedClientData.name.split(' ');
      processedContent = processedContent.replace(/\{\{first_name\}\}/g, nameParts[0] || '');
      processedContent = processedContent.replace(/\{\{last_name\}\}/g, nameParts.slice(1).join(' ') || '');
      processedContent = processedContent.replace(/\{\{customer_phone\}\}/g, selectedClientData.phone || '');
    }
    
    // === BOOKING VARIABLES ===
    if (booking) {
      const bookingDate = booking.date_time ? new Date(booking.date_time) : null;
      
      // Basic booking info
      processedContent = processedContent.replace(/\{\{booking_id\}\}/g, booking.id.toString());
      processedContent = processedContent.replace(/\{\{booking_date\}\}/g, bookingDate ? bookingDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '');
      processedContent = processedContent.replace(/\{\{booking_time\}\}/g, bookingDate ? bookingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
      processedContent = processedContent.replace(/\{\{service_type\}\}/g, booking.service_type || '');
      processedContent = processedContent.replace(/\{\{cleaning_type\}\}/g, booking.cleaning_type || '');
      processedContent = processedContent.replace(/\{\{address\}\}/g, booking.address || '');
      processedContent = processedContent.replace(/\{\{postcode\}\}/g, booking.postcode || '');
      processedContent = processedContent.replace(/\{\{total_cost\}\}/g, booking.total_cost ? `£${booking.total_cost.toFixed(2)}` : '');
      processedContent = processedContent.replace(/\{\{total_hours\}\}/g, booking.total_hours?.toString() || '');
      processedContent = processedContent.replace(/\{\{booking_status\}\}/g, booking.booking_status || '');
      
      // Cleaner info from booking
      processedContent = processedContent.replace(/\{\{cleaner_name\}\}/g, booking.cleaner_name || 'To be assigned');
      processedContent = processedContent.replace(/\{\{cleaner_phone\}\}/g, booking.cleaner_phone || '');
      
      // Payment info from booking
      processedContent = processedContent.replace(/\{\{payment_status\}\}/g, booking.payment_status || '');
      processedContent = processedContent.replace(/\{\{payment_method\}\}/g, booking.payment_method || '');
      processedContent = processedContent.replace(/\{\{amount\}\}/g, booking.total_cost ? `£${booking.total_cost.toFixed(2)}` : '');
      processedContent = processedContent.replace(/\{\{invoice_link\}\}/g, booking.invoice_link || '');
      
      // Customer info from booking if no client selected
      if (!selectedClientData) {
        if (booking.first_name) {
          processedContent = processedContent.replace(/\{\{customer_name\}\}/g, `${booking.first_name} ${booking.last_name || ''}`.trim());
          processedContent = processedContent.replace(/\{\{first_name\}\}/g, booking.first_name);
          processedContent = processedContent.replace(/\{\{last_name\}\}/g, booking.last_name || '');
        }
        if (booking.email) {
          processedContent = processedContent.replace(/\{\{customer_email\}\}/g, booking.email);
        }
        if (booking.phone_number) {
          processedContent = processedContent.replace(/\{\{customer_phone\}\}/g, booking.phone_number);
        }
      }
    }
    
    // === ACCOUNT VARIABLES ===
    if (selectedClientData) {
      const customerId = selectedClientData.id.replace('customer_', '').replace('cleaner_', '');
      const addCardLink = `https://dkomihipebixlegygnoy.supabase.co/functions/v1/redirect-to-payment-collection?customer_id=${customerId}`;
      
      processedContent = processedContent.replace(/\{\{add_card_link\}\}/g, addCardLink);
      processedContent = processedContent.replace(/\{\{login_link\}\}/g, 'https://account.sncleaningservices.co.uk/auth');
      processedContent = processedContent.replace(/\{\{dashboard_link\}\}/g, 'https://account.sncleaningservices.co.uk/dashboard');
      processedContent = processedContent.replace(/\{\{temp_password\}\}/g, 'TempPass123!');
    }
    
    // Payment link - use invoice_link from booking if available
    if (booking?.invoice_link) {
      processedContent = processedContent.replace(/\{\{payment_link\}\}/g, booking.invoice_link);
    } else {
      processedContent = processedContent.replace(/\{\{payment_link\}\}/g, '');
    }
    
    // === COMPANY VARIABLES (always available) ===
    processedContent = processedContent.replace(/\{\{company_name\}\}/g, 'SN Cleaning Services');
    processedContent = processedContent.replace(/\{\{company_email\}\}/g, 'sales@sncleaningservices.co.uk');
    processedContent = processedContent.replace(/\{\{company_phone\}\}/g, '020 1234 5678');
    
    // === OTHER VARIABLES ===
    // photo_link would need to be generated based on booking photos - placeholder for now
    if (booking) {
      processedContent = processedContent.replace(/\{\{photo_link\}\}/g, `https://account.sncleaningservices.co.uk/photos/${booking.id}`);
    }
    
    // error_message is typically only used in failure notifications - leave as placeholder
    processedContent = processedContent.replace(/\{\{error_message\}\}/g, '');
    
    return processedContent;
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const processedContent = processTemplateVariables(template.content);
      setMessage(processedContent);
      setSelectedTemplate(templateId);
    }
  };

  const handleClientSelect = (clientId: string) => {
    // Clear booking selection when client changes - bookings are customer-specific
    setSelectedBooking('');
    setBookingSearch('');
    
    if (clientId === 'manual') {
      setSelectedClient('manual');
      // Re-process template if one is selected to reset variables
      if (selectedTemplate && message) {
        const template = templates.find(t => t.id === selectedTemplate);
        if (template) {
          setMessage(processTemplateVariables(template.content, undefined, undefined));
        }
      }
      return;
    }
    
    const client = recipients.find(r => r.id === clientId);
    if (client) {
      setPhoneNumber(client.phone);
      setSelectedClient(clientId);
      
      // Re-process template if one is selected (without booking since we cleared it)
      if (selectedTemplate && message) {
        const template = templates.find(t => t.id === selectedTemplate);
        if (template) {
          const processedContent = processTemplateVariables(template.content, client, undefined);
          setMessage(processedContent);
        }
      }
    } else {
      setSelectedClient('manual');
    }
    setClientComboOpen(false);
  };

  const clearTemplate = () => {
    setSelectedTemplate('');
    setMessage('');
    setSelectedBooking('');
  };

  const handleBookingSelect = (bookingId: string) => {
    setSelectedBooking(bookingId);
    const booking = bookings.find(b => b.id.toString() === bookingId);
    
    if (booking) {
      // Auto-select client if booking has customer
      if (booking.customer) {
        const clientId = `customer_${booking.customer}`;
        const client = recipients.find(r => r.id === clientId);
        if (client) {
          setSelectedClient(clientId);
          setPhoneNumber(client.phone);
        } else if (booking.phone_number) {
          // Use booking's phone number if client not in recipients list
          setPhoneNumber(booking.phone_number);
          setSelectedClient('manual');
        }
      }
      
      // Re-process template if one is selected
      if (selectedTemplate) {
        const template = templates.find(t => t.id === selectedTemplate);
        if (template) {
          const client = selectedClient !== 'manual' ? recipients.find(r => r.id === selectedClient) : undefined;
          const processedContent = processTemplateVariables(template.content, client, booking);
          setMessage(processedContent);
        }
      }
    }
  };

  // Filter bookings based on selected client and search
  const filteredBookings = bookings.filter(booking => {
    // First, filter by selected customer - only show their bookings
    if (selectedClient !== 'manual') {
      const selectedClientData = recipients.find(r => r.id === selectedClient);
      if (selectedClientData?.customerId && booking.customer !== selectedClientData.customerId) {
        return false;
      }
    }
    
    // Then apply search filter
    if (!bookingSearch.trim()) return true;
    const searchLower = bookingSearch.toLowerCase();
    const customerName = `${booking.first_name || ''} ${booking.last_name || ''}`.toLowerCase();
    return (
      booking.id.toString().includes(searchLower) ||
      customerName.includes(searchLower) ||
      booking.address?.toLowerCase().includes(searchLower) ||
      new Date(booking.date_time).toLocaleDateString().includes(searchLower)
    );
  });

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
                <Popover open={clientComboOpen} onOpenChange={setClientComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientComboOpen}
                      className="w-full justify-between"
                    >
                      {selectedClient === 'manual' 
                        ? "Enter phone number manually"
                        : recipients.find(r => r.id === selectedClient)?.name || "Select client..."
                      }
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search by name or phone number..." />
                      <CommandEmpty>No client found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          <CommandItem
                            value="manual"
                            onSelect={() => handleClientSelect('manual')}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedClient === 'manual' ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <Phone className="mr-2 h-4 w-4" />
                            Enter phone number manually
                          </CommandItem>
                          {recipients.map((recipient) => (
                            <CommandItem
                              key={recipient.id}
                              value={`${recipient.name} ${recipient.phone}`.toLowerCase()}
                              onSelect={() => handleClientSelect(recipient.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedClient === recipient.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className={`mr-2 w-2 h-2 rounded-full ${
                                recipient.type === 'customer' ? 'bg-blue-500' : 'bg-green-500'
                              }`} />
                              <div className="flex flex-col">
                                <span>{recipient.name}</span>
                                <span className="text-sm text-muted-foreground">{recipient.phone}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                  Template loaded and variables replaced with real data. You can edit the message below before sending.
                </p>
              )}
            </div>
          )}

          {/* Booking Selection - shown when template is selected */}
          {selectedTemplate && bookings.length > 0 && (
            <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Select Booking (for booking-related variables)
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, name, address, or date..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedBooking} onValueChange={handleBookingSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a booking to use its data..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {filteredBookings.slice(0, 50).map((booking) => (
                    <SelectItem key={booking.id} value={booking.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          #{booking.id} - {booking.first_name} {booking.last_name || ''}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(booking.date_time).toLocaleDateString()} - {booking.address?.substring(0, 30)}...
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  {filteredBookings.length === 0 && (
                    <div className="py-2 px-3 text-sm text-muted-foreground">
                      No bookings found
                    </div>
                  )}
                </SelectContent>
              </Select>
              {selectedBooking && (
                <p className="text-xs text-muted-foreground">
                  Booking data will populate variables like date, time, address, cost, etc.
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
                <span>{smsCount} SMS{smsCount > 1 ? "s" : ""}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The exact text above will be sent. Template variables are automatically replaced with real data when you select a client.
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