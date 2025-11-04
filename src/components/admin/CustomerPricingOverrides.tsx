import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { useAllCustomerPricingOverrides } from '@/hooks/useCustomerPricingOverride';
import { useServiceTypes, useCleaningTypes } from '@/hooks/useCompanySettings';
import { cn } from '@/lib/utils';

interface FormData {
  customer_id: string;
  service_type: string;
  cleaning_type: string;
  override_rate: string;
}

export const CustomerPricingOverrides = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    customer_id: '',
    service_type: '',
    cleaning_type: '',
    override_rate: '',
  });
  const [availableCleaningTypes, setAvailableCleaningTypes] = useState<any[]>([]);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);

  const { data: overrides = [], isLoading } = useAllCustomerPricingOverrides();
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name, full_name')
        .order('first_name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch service types from company_settings
  const { data: serviceTypes = [] } = useServiceTypes();
  
// Fetch all cleaning types from company settings
  const { data: cleaningTypes = [], isLoading: loadingCleaningTypes } = useCleaningTypes();

  // Update available cleaning types when service type changes
  useEffect(() => {
    if (!formData.service_type) {
      setAvailableCleaningTypes([]);
      setFormData(prev => ({ ...prev, cleaning_type: '' }));
      return;
    }

    // Use allowed_cleaning_types from the selected service type
    const selectedService = serviceTypes.find((st: any) => st.key === formData.service_type);
    const allowedKeys: string[] = selectedService?.allowed_cleaning_types || [];

    if (allowedKeys.length > 0) {
      const available = (cleaningTypes || []).filter((ct: any) => allowedKeys.includes(ct.key));
      setAvailableCleaningTypes(available);
    } else {
      setAvailableCleaningTypes([]);
      setFormData(prev => ({ ...prev, cleaning_type: '' }));
    }
  }, [formData.service_type, serviceTypes, cleaningTypes]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('customer_pricing_overrides')
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-customer-pricing-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['customer-pricing-override'] });
      toast.success('Override created successfully');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create override');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('customer_pricing_overrides')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-customer-pricing-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['customer-pricing-override'] });
      toast.success('Override updated successfully');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update override');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customer_pricing_overrides')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-customer-pricing-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['customer-pricing-override'] });
      toast.success('Override deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete override');
    },
  });

  const handleOpenDialog = (override?: any) => {
    if (override) {
      setEditingId(override.id);
      setFormData({
        customer_id: override.customer_id.toString(),
        service_type: override.service_type,
        cleaning_type: override.cleaning_type || '',
        override_rate: override.override_rate.toString(),
      });
    } else {
      setEditingId(null);
      setFormData({
        customer_id: '',
        service_type: '',
        cleaning_type: '',
        override_rate: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({
      customer_id: '',
      service_type: '',
      cleaning_type: '',
      override_rate: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.customer_id || !formData.service_type || !formData.override_rate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const data = {
      customer_id: parseInt(formData.customer_id),
      service_type: formData.service_type,
      cleaning_type: formData.cleaning_type || null,
      override_rate: parseFloat(formData.override_rate),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getCustomerName = (override: any) => {
    const customer = override.customers;
    if (!customer) return 'Unknown';
    return customer.full_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown';
  };

  const getServiceTypeName = (key: string) => {
    const service = serviceTypes.find((st: any) => st.key === key);
    return service?.label || key;
  };

  const serviceHasCleaningTypes = (serviceKey: string) => {
    const service = serviceTypes.find((st: any) => st.key === serviceKey);
    return !!(service?.allowed_cleaning_types && service.allowed_cleaning_types.length > 0);
  };

  const getCleaningTypeName = (key: string | null) => {
    if (!key) return '(All)';
    const ct = (cleaningTypes as any[]).find((c: any) => c.key === key);
    return ct?.label || key;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Customer Pricing Overrides</h2>
          <p className="text-muted-foreground mt-1">
            Manage custom hourly rate adjustments for specific customers and services
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Override
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Cleaning Type</TableHead>
              <TableHead>Override Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : overrides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No overrides configured yet
                </TableCell>
              </TableRow>
            ) : (
              overrides.map((override: any) => (
                <TableRow key={override.id}>
                  <TableCell className="font-medium">{getCustomerName(override)}</TableCell>
                  <TableCell>{getServiceTypeName(override.service_type)}</TableCell>
                  <TableCell>
                    {override.service_type === 'airbnb-cleaning' 
                      ? getCleaningTypeName(override.cleaning_type)
                      : override.cleaning_type 
                        ? override.cleaning_type 
                        : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    <span className={override.override_rate < 0 ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>
                      {override.override_rate < 0 ? '-' : '+'}£{Math.abs(override.override_rate)}/hr
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(override)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this override?')) {
                            deleteMutation.mutate(override.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'Add'} Pricing Override</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerSearchOpen}
                    className="w-full justify-between"
                  >
                    {formData.customer_id
                      ? customers.find((c: any) => c.id.toString() === formData.customer_id)?.full_name ||
                        `${customers.find((c: any) => c.id.toString() === formData.customer_id)?.first_name || ''} ${customers.find((c: any) => c.id.toString() === formData.customer_id)?.last_name || ''}`.trim()
                      : "Search customer..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-background" align="start">
                  <Command>
                    <CommandInput placeholder="Search customer..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((customer: any) => {
                          const displayName = customer.full_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
                          return (
                            <CommandItem
                              key={customer.id}
                              value={`${customer.id}-${displayName}`}
                              onSelect={() => {
                                setFormData({ ...formData, customer_id: customer.id.toString() });
                                setCustomerSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.customer_id === customer.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {displayName}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_type">Service Type *</Label>
              <Select
                value={formData.service_type}
                onValueChange={(value) => {
                  console.log('Service type selected:', value);
                  setFormData({ ...formData, service_type: value, cleaning_type: '' });
                }}
              >
                <SelectTrigger id="service_type">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {serviceTypes.map((service: any) => (
                    <SelectItem key={service.key} value={service.key}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            {availableCleaningTypes.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="cleaning_type">Cleaning Type</Label>
                <Select
                  value={formData.cleaning_type}
                  onValueChange={(value) => setFormData({ ...formData, cleaning_type: value })}
                >
                  <SelectTrigger id="cleaning_type">
                    <SelectValue placeholder="All (leave blank for entire service)" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="">All cleaning types</SelectItem>
                    {availableCleaningTypes.map((cleaningType: any) => (
                      <SelectItem key={cleaningType.key} value={cleaningType.key}>
                        {cleaningType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Leave empty to apply override to all cleaning types
                </p>
              </div>
            )}

            {isLoadingCleaningTypes && formData.service_type === 'airbnb-cleaning' && (
              <div className="text-sm text-muted-foreground">
                Loading cleaning types...
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="override_rate">Override Rate (£/hour) *</Label>
              <Input
                id="override_rate"
                type="number"
                step="0.01"
                placeholder="e.g., -3 for discount, +5 for markup"
                value={formData.override_rate}
                onChange={(e) => setFormData({ ...formData, override_rate: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Negative value = discount, Positive value = markup
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
