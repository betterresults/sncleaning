import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useSalesAgents, CreateTaskInput } from '@/hooks/useAgentTasks';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Check, ChevronsUpDown, X } from 'lucide-react';
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
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
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
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  
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
          // Fetch customers with more fields for better search
          const { data: customerData } = await supabase
            .from('customers')
            .select('id, full_name, first_name, last_name, email, phone')
            .order('full_name');
          
          if (customerData) setCustomers(customerData);

          // Fetch recent bookings (last 100)
          const { data: bookingData } = await supabase
            .from('bookings')
            .select('id, date_only, address, postcode, service_type, customer, first_name, last_name')
            .order('date_only', { ascending: false })
            .limit(100);
          
          if (bookingData) setBookings(bookingData);
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
    return `#${booking.id} - ${date}${name ? ` - ${name}` : ''}${location ? ` (${location})` : ''}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Assign a task to a sales agent
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Follow up on cleaning quality"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add details about what needs to be done..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="task_type">Task Type</Label>
                <Select
                  value={formData.task_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, task_type: value }))}
                >
                  <SelectTrigger>
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

              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assigned_to">Assign To *</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
                disabled={loadingAgents}
              >
                <SelectTrigger>
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

            <div className="grid gap-2">
              <Label htmlFor="customer_id">Customer (Optional)</Label>
              <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerPopoverOpen}
                    className="justify-between font-normal"
                    disabled={loadingData}
                  >
                    {loadingData ? (
                      "Loading..."
                    ) : selectedCustomer ? (
                      <span className="truncate">{getCustomerDisplayName(selectedCustomer)}</span>
                    ) : (
                      "Search for a customer..."
                    )}
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      {selectedCustomer && (
                        <X 
                          className="h-4 w-4 opacity-50 hover:opacity-100" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({ ...prev, customer_id: '', booking_id: '' }));
                          }}
                        />
                      )}
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Search by name, email, phone, or ID..." 
                      value={customerSearch}
                      onValueChange={setCustomerSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No customers found.</CommandEmpty>
                      <CommandGroup>
                        {filteredCustomers.slice(0, 50).map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.id.toString()}
                            onSelect={() => {
                              setFormData(prev => ({ 
                                ...prev, 
                                customer_id: customer.id.toString(),
                                booking_id: '' 
                              }));
                              setCustomerPopoverOpen(false);
                              setCustomerSearch('');
                            }}
                            className="flex flex-col items-start py-2"
                          >
                            <div className="flex items-center w-full">
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  formData.customer_id === customer.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-medium truncate">
                                  {getCustomerDisplayName(customer)}
                                </span>
                                {getCustomerSubtext(customer) && (
                                  <span className="text-xs text-muted-foreground truncate">
                                    {getCustomerSubtext(customer)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                        {filteredCustomers.length > 50 && (
                          <div className="p-2 text-xs text-center text-muted-foreground">
                            Showing 50 of {filteredCustomers.length} results. Type to narrow down.
                          </div>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="booking_id">Booking (Optional)</Label>
              <Select
                value={formData.booking_id || "none"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, booking_id: value === "none" ? "" : value }))}
                disabled={loadingData}
              >
                <SelectTrigger>
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

            <div className="grid gap-2">
              <Label>Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !formData.title || !formData.assigned_to}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
