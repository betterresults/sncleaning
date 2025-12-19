import React, { useState, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSalesAgents, CreateTaskInput } from '@/hooks/useAgentTasks';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, Check, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  prefilledCustomerId?: number | null;
  prefilledBookingId?: number | null;
}

const TASK_TYPES = [
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'call_customer', label: 'Call Customer' },
  { value: 'check_service', label: 'Check Service Quality' },
  { value: 'collect_feedback', label: 'Collect Feedback' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
];

interface Customer {
  id: number;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
}

interface Booking {
  id: number;
  date_only: string | null;
  address: string | null;
  postcode: string | null;
  service_type: string | null;
  customer: number | null;
  first_name: string | null;
  last_name: string | null;
  isPastBooking?: boolean;
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  prefilledCustomerId,
  prefilledBookingId,
}) => {
  const { agents, loading: loadingAgents } = useSalesAgents();
  const [submitting, setSubmitting] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSectionOpen, setCustomerSectionOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'follow_up',
    assigned_to: '',
    priority: 'medium',
    customer_id: prefilledCustomerId?.toString() || '',
    booking_id: prefilledBookingId?.toString() || '',
  });

  // Fetch customers and bookings when dialog opens
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setLoadingData(true);
        try {
          const { data: customerData } = await supabase
            .from('customers')
            .select('id, full_name, first_name, last_name, email, phone')
            .order('full_name');
          
          if (customerData) setCustomers(customerData);

          // Fetch active bookings
          const { data: bookingData } = await supabase
            .from('bookings')
            .select('id, date_only, address, postcode, service_type, customer, first_name, last_name')
            .order('date_only', { ascending: false })
            .limit(100);

          // Fetch past/completed bookings
          const { data: pastBookingData } = await supabase
            .from('past_bookings')
            .select('id, date_only, address, postcode, service_type, customer, first_name, last_name')
            .order('date_only', { ascending: false })
            .limit(100);
          
          // Combine and mark past bookings
          const activeBookings: Booking[] = (bookingData || []).map(b => ({ ...b, isPastBooking: false }));
          const pastBookings: Booking[] = (pastBookingData || []).map(b => ({ ...b, isPastBooking: true }));
          
          // Combine and sort by date descending
          const allBookings = [...activeBookings, ...pastBookings].sort((a, b) => {
            const dateA = a.date_only ? new Date(a.date_only).getTime() : 0;
            const dateB = b.date_only ? new Date(b.date_only).getTime() : 0;
            return dateB - dateA;
          });
          
          setBookings(allBookings);
        } catch (err) {
          console.error('Error fetching data:', err);
        } finally {
          setLoadingData(false);
        }
      };
      fetchData();
    }
  }, [open]);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const search = customerSearch.toLowerCase().trim();
    return customers.filter(customer => {
      const fullName = customer.full_name?.toLowerCase() || '';
      const firstName = customer.first_name?.toLowerCase() || '';
      const lastName = customer.last_name?.toLowerCase() || '';
      const email = customer.email?.toLowerCase() || '';
      const phone = customer.phone?.toLowerCase() || '';
      const id = customer.id.toString();
      return fullName.includes(search) || 
             firstName.includes(search) || 
             lastName.includes(search) || 
             email.includes(search) || 
             phone.includes(search) ||
             id.includes(search);
    });
  }, [customers, customerSearch]);

  // Filter bookings based on selected customer
  const filteredBookings = formData.customer_id 
    ? bookings.filter(b => b.customer?.toString() === formData.customer_id)
    : bookings;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.assigned_to) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: formData.title,
        description: formData.description || undefined,
        task_type: formData.task_type,
        assigned_to: formData.assigned_to,
        priority: formData.priority,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
        booking_id: formData.booking_id ? parseInt(formData.booking_id) : null,
        due_date: dueDate ? dueDate.toISOString() : null,
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        task_type: 'follow_up',
        assigned_to: '',
        priority: 'medium',
        customer_id: '',
        booking_id: '',
      });
      setDueDate(undefined);
      setCustomerSearch('');
      setCustomerSectionOpen(false);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const getAgentDisplayName = (agent: { first_name: string | null; last_name: string | null; email: string | null }) => {
    if (agent.first_name || agent.last_name) {
      return `${agent.first_name || ''} ${agent.last_name || ''}`.trim();
    }
    return agent.email || 'Unknown';
  };

  const getCustomerDisplayName = (customer: Customer) => {
    const name = customer.full_name || 
      (customer.first_name || customer.last_name 
        ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() 
        : null);
    if (name) return name;
    if (customer.email) return customer.email;
    return `Customer #${customer.id}`;
  };

  const getCustomerSubtext = (customer: Customer) => {
    const parts: string[] = [];
    if (customer.email) parts.push(customer.email);
    if (customer.phone) parts.push(customer.phone);
    return parts.join(' • ');
  };

  const selectedCustomer = customers.find(c => c.id.toString() === formData.customer_id);

  const getBookingDisplayName = (booking: Booking) => {
    const date = booking.date_only ? format(new Date(booking.date_only), 'dd MMM yyyy') : 'No date';
    const name = booking.first_name || booking.last_name 
      ? `${booking.first_name || ''} ${booking.last_name || ''}`.trim()
      : '';
    const location = booking.postcode || booking.address || '';
    const status = booking.isPastBooking ? ' [Completed]' : '';
    return `#${booking.id} - ${date}${status}${name ? ` - ${name}` : ''}${location ? ` (${location})` : ''}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[540px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b bg-muted/30">
          <SheetTitle className="text-xl">Create New Task</SheetTitle>
          <SheetDescription>
            Assign a task to a sales agent
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 py-6">
              {/* Task Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Task Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Follow up on cleaning quality"
                  className="h-11"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add details about what needs to be done..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Task Type & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Task Type</Label>
                  <Select
                    value={formData.task_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, task_type: value }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <span className={cn("px-2 py-0.5 rounded text-xs font-medium", priority.color)}>
                            {priority.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Assign To */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Assign To <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
                  disabled={loadingAgents}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={loadingAgents ? "Loading agents..." : "Select an agent"} />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.length === 0 && !loadingAgents ? (
                      <div className="p-2 text-sm text-muted-foreground">No agents found</div>
                    ) : (
                      agents.map(agent => (
                        <SelectItem key={agent.user_id} value={agent.user_id}>
                          {getAgentDisplayName(agent)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Selection - Expandable Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Customer (Optional)</Label>
                <div className="border rounded-lg overflow-hidden">
                  {/* Selected Customer or Toggle */}
                  <button
                    type="button"
                    onClick={() => setCustomerSectionOpen(!customerSectionOpen)}
                    className="w-full flex items-center justify-between p-3 bg-background hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className={cn("text-sm", !selectedCustomer && "text-muted-foreground")}>
                      {selectedCustomer ? getCustomerDisplayName(selectedCustomer) : "Select a customer..."}
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedCustomer && (
                        <X 
                          className="h-4 w-4 text-muted-foreground hover:text-foreground" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({ ...prev, customer_id: '', booking_id: '' }));
                          }}
                        />
                      )}
                      {customerSectionOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                  
                  {/* Expanded Customer Search */}
                  {customerSectionOpen && (
                    <div className="border-t">
                      <div className="flex items-center border-b px-3 bg-muted/30">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, email, phone..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="border-0 focus-visible:ring-0 bg-transparent"
                        />
                      </div>
                      <ScrollArea className="h-[200px]">
                        {loadingData ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : filteredCustomers.length === 0 ? (
                          <div className="py-8 text-center text-sm text-muted-foreground">
                            No customers found
                          </div>
                        ) : (
                          <div className="p-1">
                            {filteredCustomers.slice(0, 50).map((customer) => (
                              <button
                                key={customer.id}
                                type="button"
                                className={cn(
                                  "w-full flex items-center gap-3 p-2.5 rounded-md text-left hover:bg-muted transition-colors",
                                  formData.customer_id === customer.id.toString() && "bg-primary/10"
                                )}
                                onClick={() => {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    customer_id: customer.id.toString(),
                                    booking_id: '' 
                                  }));
                                  setCustomerSectionOpen(false);
                                  setCustomerSearch('');
                                }}
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4 shrink-0",
                                    formData.customer_id === customer.id.toString() ? "opacity-100 text-primary" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="font-medium text-sm truncate">
                                    {getCustomerDisplayName(customer)}
                                  </span>
                                  {getCustomerSubtext(customer) && (
                                    <span className="text-xs text-muted-foreground truncate">
                                      {getCustomerSubtext(customer)}
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                            {filteredCustomers.length > 50 && (
                              <div className="p-2 text-xs text-center text-muted-foreground">
                                Showing 50 of {filteredCustomers.length} results
                              </div>
                            )}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Booking (Optional)</Label>
                <Select
                  value={formData.booking_id || "none"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, booking_id: value === "none" ? "" : value }))}
                  disabled={loadingData}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={loadingData ? "Loading..." : "Select a booking"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {filteredBookings.map(booking => (
                      <SelectItem key={booking.id} value={booking.id.toString()}>
                        {getBookingDisplayName(booking)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.customer_id && filteredBookings.length === 0 && (
                  <p className="text-xs text-muted-foreground">No bookings found for this customer</p>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Due Date (Optional)</Label>
                <div className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setCalendarOpen(!calendarOpen)}
                    className="w-full flex items-center justify-between p-3 bg-background hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className={cn("text-sm", !dueDate && "text-muted-foreground")}>
                        {dueDate ? format(dueDate, 'PPP') : "Pick a date"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {dueDate && (
                        <X 
                          className="h-4 w-4 text-muted-foreground hover:text-foreground" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDueDate(undefined);
                          }}
                        />
                      )}
                      {calendarOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                  
                  {calendarOpen && (
                    <div className="border-t p-3 flex justify-center">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={(date) => {
                          setDueDate(date);
                          setCalendarOpen(false);
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <SheetFooter className="px-6 py-4 border-t bg-muted/30">
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !formData.title || !formData.assigned_to}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Task'
                )}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
