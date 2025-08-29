import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Minus, BarChart3, Building, MapPin, Shirt } from "lucide-react";

interface InventoryItem {
  id: string;
  product_id: string;
  customer_id: number;
  address_id: string;
  clean_quantity: number;
  dirty_quantity: number;
  in_use_quantity: number;
  last_updated: string;
  linen_products?: {
    name: string;
    type: string;
    price: number;
  } | null;
  customers?: {
    first_name: string;
    last_name: string;
  } | null;
  addresses?: {
    address: string;
    postcode: string;
  } | null;
}

export const InventoryManager = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [selectedAddress, setSelectedAddress] = useState<string>("all");
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    clean_change: 0,
    dirty_change: 0,
    in_use_change: 0,
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch inventory data
  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['linen-inventory', selectedCustomer, selectedAddress],
    queryFn: async () => {
      // First get the inventory items
      let query = supabase
        .from('linen_inventory')
        .select('*')
        .order('last_updated', { ascending: false });

      if (selectedCustomer && selectedCustomer !== "all") {
        query = query.eq('customer_id', parseInt(selectedCustomer));
      }
      if (selectedAddress && selectedAddress !== "all") {
        query = query.eq('address_id', selectedAddress);
      }

      const { data: inventoryData, error } = await query;
      if (error) throw error;

      if (!inventoryData || inventoryData.length === 0) {
        return [];
      }

      // Get unique IDs for related data
      const productIds = [...new Set(inventoryData.map(item => item.product_id))];
      const customerIds = [...new Set(inventoryData.map(item => item.customer_id))];
      const addressIds = [...new Set(inventoryData.map(item => item.address_id))];

      // Fetch related data separately
      const [productsResult, customersResult, addressesResult] = await Promise.all([
        supabase.from('linen_products').select('id, name, type, price').in('id', productIds),
        supabase.from('customers').select('id, first_name, last_name').in('id', customerIds),
        supabase.from('addresses').select('id, address, postcode').in('id', addressIds)
      ]);

      if (productsResult.error) throw productsResult.error;
      if (customersResult.error) throw customersResult.error;
      if (addressesResult.error) throw addressesResult.error;

      // Create lookup maps
      const productsMap = new Map(productsResult.data?.map(p => [p.id, p]) || []);
      const customersMap = new Map(customersResult.data?.map(c => [c.id, c]) || []);
      const addressesMap = new Map(addressesResult.data?.map(a => [a.id, a]) || []);

      // Combine data
      return inventoryData.map(item => ({
        ...item,
        linen_products: productsMap.get(item.product_id) || null,
        customers: customersMap.get(item.customer_id) || null,
        addresses: addressesMap.get(item.address_id) || null
      }));
    }
  });

  // Fetch customers for filter
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-for-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name')
        .order('first_name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch addresses for selected customer
  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses-for-inventory', selectedCustomer],
    queryFn: async () => {
      if (!selectedCustomer || selectedCustomer === "all") return [];
      const { data, error } = await supabase
        .from('addresses')
        .select('id, address, postcode')
        .eq('customer_id', parseInt(selectedCustomer))
        .order('is_default', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCustomer && selectedCustomer !== "all"
  });

  // Create inventory adjustment mutation (simplified version)
  const adjustInventoryMutation = useMutation({
    mutationFn: async ({ item, adjustment }: { item: InventoryItem; adjustment: any }) => {
      // Update inventory directly without movement tracking for now
      const { error: updateError } = await supabase
        .from('linen_inventory')
        .update({
          clean_quantity: Math.max(0, item.clean_quantity + adjustment.clean_change),
          dirty_quantity: Math.max(0, item.dirty_quantity + adjustment.dirty_change),
          in_use_quantity: Math.max(0, item.in_use_quantity + adjustment.in_use_change),
          last_updated: new Date().toISOString()
        })
        .eq('id', item.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linen-inventory'] });
      setIsAdjustmentDialogOpen(false);
      setSelectedInventoryItem(null);
      setAdjustmentData({ clean_change: 0, dirty_change: 0, in_use_change: 0, notes: "" });
      toast({ title: "Inventory adjusted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error adjusting inventory", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleAdjustment = () => {
    if (!selectedInventoryItem) return;
    adjustInventoryMutation.mutate({
      item: selectedInventoryItem,
      adjustment: adjustmentData
    });
  };

  const openAdjustmentDialog = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
    setAdjustmentData({ clean_change: 0, dirty_change: 0, in_use_change: 0, notes: "" });
    setIsAdjustmentDialogOpen(true);
  };

  const getTotalValue = (item: InventoryItem) => {
    const totalQuantity = item.clean_quantity + item.dirty_quantity + item.in_use_quantity;
    return totalQuantity * (item.linen_products?.price || 0);
  };

  const getStatusColor = (clean: number, dirty: number, inUse: number) => {
    const total = clean + dirty + inUse;
    if (total === 0) return "bg-gray-500";
    if (inUse > 0) return "bg-blue-500";
    if (dirty > clean) return "bg-red-500";
    if (clean > dirty * 2) return "bg-green-500";
    return "bg-yellow-500";
  };

  const getLinenIcon = (productType: string) => {
    const type = productType?.toLowerCase() || '';
    if (type.includes('king') || type.includes('bed')) return '🛏️';
    if (type.includes('towel')) return '🏊';
    if (type.includes('pillow')) return '🛌';  
    if (type.includes('duvet') || type.includes('comforter')) return '🌙';
    if (type.includes('sheet')) return '📄';
    return '🏠';
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Label htmlFor="customer-filter">Filter by Customer</Label>
          <Select value={selectedCustomer} onValueChange={(value) => {
            setSelectedCustomer(value);
            setSelectedAddress("all"); // Reset address when customer changes
          }}>
            <SelectTrigger>
              <SelectValue placeholder="All customers..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All customers</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  {customer.first_name} {customer.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCustomer && selectedCustomer !== "all" && (
          <div className="flex-1">
            <Label htmlFor="address-filter">Filter by Address</Label>
            <Select value={selectedAddress} onValueChange={setSelectedAddress}>
              <SelectTrigger>
                <SelectValue placeholder="All addresses..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All addresses</SelectItem>
                {addresses.map((address) => (
                  <SelectItem key={address.id} value={address.id}>
                    {address.address}, {address.postcode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Inventory Cards */}
      {inventory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Inventory Found</h3>
            <p className="text-muted-foreground text-center">
              No linen inventory records found for the selected filters. 
              Inventory will be created when orders are delivered.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {inventory.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-all duration-200 border-2">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getLinenIcon(item.linen_products?.type || '')}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">
                        {item.linen_products?.name}
                      </CardTitle>
                      <CardDescription className="text-sm font-medium">
                        {item.linen_products?.type} • £{item.linen_products?.price?.toFixed(2)} each
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-bold ${getStatusColor(item.clean_quantity, item.dirty_quantity, item.in_use_quantity)} text-white border-0 px-3 py-1`}
                  >
                    {item.clean_quantity + item.dirty_quantity + item.in_use_quantity} Total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer & Address */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      {item.customers?.first_name} {item.customers?.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{item.addresses?.address}, {item.addresses?.postcode}</span>
                  </div>
                </div>

                {/* Quantities - Now with 3 columns */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg text-center">
                    <div className="text-xl font-bold text-green-700 dark:text-green-400">
                      {item.clean_quantity}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-500 font-medium">Clean</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg text-center">
                    <div className="text-xl font-bold text-red-700 dark:text-red-400">
                      {item.dirty_quantity}
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-500 font-medium">Dirty</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg text-center">
                    <div className="text-xl font-bold text-blue-700 dark:text-blue-400">
                      {item.in_use_quantity}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-500 font-medium">In Use</div>
                  </div>
                </div>

                {/* Value & Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Total Value: </span>
                    <span className="font-bold text-lg">£{getTotalValue(item).toFixed(2)}</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openAdjustmentDialog(item)}
                    className="font-medium"
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Adjust
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Adjustment Dialog */}
      <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Inventory</DialogTitle>
            <DialogDescription>
              Adjust the quantity of {selectedInventoryItem?.linen_products?.name} at this location
            </DialogDescription>
          </DialogHeader>

          {selectedInventoryItem && (
            <div className="space-y-4">
              {/* Current quantities */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-sm text-muted-foreground">Current Clean</Label>
                  <div className="text-lg font-bold text-green-600">
                    {selectedInventoryItem.clean_quantity}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Current Dirty</Label>
                  <div className="text-lg font-bold text-red-600">
                    {selectedInventoryItem.dirty_quantity}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Current In Use</Label>
                  <div className="text-lg font-bold text-blue-600">
                    {selectedInventoryItem.in_use_quantity}
                  </div>
                </div>
              </div>

              {/* Adjustments */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="clean_change">Clean Quantity Change</Label>
                  <Input
                    id="clean_change"
                    type="number"
                    value={adjustmentData.clean_change}
                    onChange={(e) => setAdjustmentData(prev => ({ 
                      ...prev, 
                      clean_change: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="0"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    New total: {Math.max(0, selectedInventoryItem.clean_quantity + adjustmentData.clean_change)}
                  </div>
                </div>
                <div>
                  <Label htmlFor="dirty_change">Dirty Quantity Change</Label>
                  <Input
                    id="dirty_change"
                    type="number"
                    value={adjustmentData.dirty_change}
                    onChange={(e) => setAdjustmentData(prev => ({ 
                      ...prev, 
                      dirty_change: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="0"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    New total: {Math.max(0, selectedInventoryItem.dirty_quantity + adjustmentData.dirty_change)}
                  </div>
                </div>
                <div>
                  <Label htmlFor="in_use_change">In Use Quantity Change</Label>
                  <Input
                    id="in_use_change"
                    type="number"
                    value={adjustmentData.in_use_change}
                    onChange={(e) => setAdjustmentData(prev => ({ 
                      ...prev, 
                      in_use_change: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="0"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    New total: {Math.max(0, selectedInventoryItem.in_use_quantity + adjustmentData.in_use_change)}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="adjustment_notes">Notes</Label>
                <Input
                  id="adjustment_notes"
                  value={adjustmentData.notes}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Reason for adjustment..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAdjustment}
              disabled={adjustInventoryMutation.isPending}
            >
              {adjustInventoryMutation.isPending ? "Adjusting..." : "Apply Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};