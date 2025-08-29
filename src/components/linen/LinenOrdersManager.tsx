import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ShoppingCart, Edit, Eye, Calendar, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface LinenOrder {
  id: string;
  customer_id: number;
  address_id: string;
  order_date: string;
  delivery_date?: string;
  pickup_date?: string;
  status: 'scheduled' | 'delivered' | 'picked_up' | 'cancelled' | 'postponed';
  total_cost: number;
  notes?: string;
  created_at: string;
}

interface LinenProduct {
  id: string;
  name: string;
  type: 'pack' | 'individual';
  price: number;
  description?: string;
  items_included?: string;
  is_active: boolean;
}

interface Customer {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

interface Address {
  id: string;
  customer_id: number;
  address: string;
  postcode: string;
  is_default?: boolean;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

interface OrderFormData {
  customer_id: string;
  address_id: string;
  delivery_date: string;
  notes: string;
  items: OrderItem[];
}

export const LinenOrdersManager = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [formData, setFormData] = useState<OrderFormData>({
    customer_id: "",
    address_id: "",
    delivery_date: "",
    notes: "",
    items: []
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders with customer info
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['linen-orders'],
    queryFn: async () => {
      console.log('Fetching linen orders...');
      
      // First get the orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('linen_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ordersError) {
        console.error('Linen orders query error:', ordersError);
        throw ordersError;
      }
      
      if (!ordersData || ordersData.length === 0) {
        console.log('No orders found');
        return [];
      }
      
      // Get unique customer IDs and address IDs
      const customerIds = [...new Set(ordersData.map(o => o.customer_id))];
      const addressIds = [...new Set(ordersData.map(o => o.address_id))];
      
      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, phone')
        .in('id', customerIds);
        
      if (customersError) {
        console.error('Customers query error:', customersError);
        throw customersError;
      }
      
      // Fetch addresses
      const { data: addressesData, error: addressesError } = await supabase
        .from('addresses')
        .select('id, address, postcode')
        .in('id', addressIds);
        
      if (addressesError) {
        console.error('Addresses query error:', addressesError);
        throw addressesError;
      }
      
      // Combine the data
      const enrichedOrders = ordersData.map(order => ({
        ...order,
        customers: customersData?.find(c => c.id === order.customer_id) || null,
        addresses: addressesData?.find(a => a.id === order.address_id) || null
      }));
      
      console.log('Fetched linen orders:', enrichedOrders);
      return enrichedOrders;
    }
  });

  // Fetch products for order creation
  const { data: products = [] } = useQuery({
    queryKey: ['linen-products-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('linen_products')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as LinenProduct[];
    }
  });

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, phone')
        .order('first_name');
      
      if (error) throw error;
      return data as Customer[];
    }
  });

  // Fetch addresses for selected customer
  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses', selectedCustomer],
    queryFn: async () => {
      if (!selectedCustomer) return [];
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('customer_id', parseInt(selectedCustomer))
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data as Address[];
    },
    enabled: !!selectedCustomer
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: OrderFormData) => {
      // First create the order
      const { data: order, error: orderError } = await supabase
        .from('linen_orders')
        .insert([{
          customer_id: parseInt(orderData.customer_id),
          address_id: orderData.address_id,
          delivery_date: orderData.delivery_date || null,
          notes: orderData.notes,
          status: 'scheduled'
        }])
        .select()
        .single();
      
      if (orderError) throw orderError;

      // Then create the order items
      if (orderData.items.length > 0) {
        const orderItems = orderData.items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }));

        const { error: itemsError } = await supabase
          .from('linen_order_items')
          .insert(orderItems);
        
        if (itemsError) throw itemsError;
      }

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linen-orders'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Order created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating order", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      customer_id: "",
      address_id: "",
      delivery_date: "",
      notes: "",
      items: []
    });
    setSelectedCustomer("");
  };

  const addOrderItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: "", quantity: 1, unit_price: 0 }]
    }));
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeOrderItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateOrderItem(index, 'product_id', productId);
      updateOrderItem(index, 'unit_price', product.price);
    }
  };

  const getTotalCost = () => {
    return formData.items.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
  };

  const handleSubmit = () => {
    if (!formData.customer_id || !formData.address_id) {
      toast({ title: "Please select customer and address", variant: "destructive" });
      return;
    }

    if (formData.items.length === 0) {
      toast({ title: "Please add at least one item to the order", variant: "destructive" });
      return;
    }

    const hasIncompleteItems = formData.items.some(item => 
      !item.product_id || item.quantity <= 0
    );
    
    if (hasIncompleteItems) {
      toast({ title: "Please complete all order items", variant: "destructive" });
      return;
    }

    createOrderMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      scheduled: "outline",
      delivered: "default",
      picked_up: "secondary",
      cancelled: "destructive",
      postponed: "secondary"
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (ordersLoading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  if (ordersError) {
    console.error('Orders loading error:', ordersError);
    return (
      <div className="text-center py-8 text-destructive">
        Error loading orders: {ordersError.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Orders ({orders.length})</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Linen Order</DialogTitle>
              <DialogDescription>
                Create a new linen order for a customer
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Customer Selection */}
              <div>
                <Label htmlFor="customer">Customer *</Label>
                <Select 
                  value={selectedCustomer} 
                  onValueChange={(value) => {
                    setSelectedCustomer(value);
                    setFormData(prev => ({ ...prev, customer_id: value, address_id: "" }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.first_name} {customer.last_name} ({customer.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Address Selection */}
              {selectedCustomer && (
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Select 
                    value={formData.address_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, address_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select address..." />
                    </SelectTrigger>
                    <SelectContent>
                      {addresses.map((address) => (
                        <SelectItem key={address.id} value={address.id}>
                          {address.address}, {address.postcode}
                          {address.is_default && " (Default)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Delivery Date */}
              <div>
                <Label htmlFor="delivery_date">Delivery Date</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                />
              </div>

              {/* Order Items */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Order Items *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addOrderItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                {formData.items.length === 0 ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No items added yet</p>
                    <Button type="button" variant="outline" size="sm" onClick={addOrderItem} className="mt-2">
                      Add First Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-end p-3 border rounded-lg">
                        <div className="flex-1">
                          <Label className="text-xs">Product</Label>
                          <Select 
                            value={item.product_id} 
                            onValueChange={(value) => handleProductSelect(index, value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select product..." />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - £{product.price.toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-20">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="h-8"
                          />
                        </div>
                        <div className="w-20">
                          <Label className="text-xs">Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => updateOrderItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <div className="w-20 text-center">
                          <Label className="text-xs">Subtotal</Label>
                          <div className="text-sm font-medium">
                            £{(item.quantity * item.unit_price).toFixed(2)}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOrderItem(index)}
                          className="h-8 w-8 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    
                    <div className="flex justify-end pt-2 border-t">
                      <div className="text-lg font-bold">
                        Total: £{getTotalCost().toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Order notes or special instructions..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createOrderMutation.isPending}
              >
                Create Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No Orders Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first linen order to start managing deliveries and pickups.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      #{order.id.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {order.customers?.first_name} {order.customers?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.customers?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm">
                        {order.addresses?.address}, {order.addresses?.postcode}
                      </p>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.order_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {order.delivery_date 
                        ? format(new Date(order.delivery_date), 'MMM dd, yyyy')
                        : 'Not set'
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="font-medium">
                      £{order.total_cost.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};