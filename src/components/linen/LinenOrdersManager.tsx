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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, ShoppingCart, Edit, Eye, Calendar, Package, CreditCard, MapPin, User, Banknote, Trash2, Copy, Truck, PackageCheck, FileDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { pdf } from '@react-pdf/renderer';
import { LinenOrderPDF } from './LinenOrderPDF';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { EditOrderDialog } from "./EditOrderDialog";
import { DuplicateLinenOrderDialog } from "./DuplicateLinenOrderDialog";
import PaymentStatusIndicator from '@/components/payments/PaymentStatusIndicator';
import ManualLinenPaymentDialog from './ManualLinenPaymentDialog';

interface LinenOrder {
  id: string;
  customer_id: number;
  address_id: string;
  order_date: string;
  delivery_date?: string;
  pickup_date?: string;
  status: 'scheduled' | 'delivered' | 'picked_up' | 'cancelled' | 'postponed';
  payment_status: 'unpaid' | 'paid' | 'pending' | 'refunded';
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'stripe' | 'invoice';
  total_cost: number;
  admin_cost: number;
  notes?: string;
  created_at: string;
}

interface LinenProduct {
  id: string;
  name: string;
  type: 'pack' | 'individual';
  price: number;
  supplier_cost: number;
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
  includeDelivery: boolean;
  includePackaging: boolean;
}

export const LinenOrdersManager = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [formData, setFormData] = useState<OrderFormData>({
    customer_id: "",
    address_id: "",
    delivery_date: "",
    notes: "",
    items: [],
    includeDelivery: false,
    includePackaging: false
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
      // Calculate total_cost and admin_cost
      let totalCost = 0;
      let adminCost = 0;

      for (const item of orderData.items) {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          totalCost += item.quantity * item.unit_price;
          adminCost += item.quantity * (product.supplier_cost || 0);
        }
      }

      // Calculate additional charges
      let deliveryCharge = 0;
      let packagingCharge = 0;

      if (orderData.includeDelivery) {
        deliveryCharge = 18;
        adminCost += deliveryCharge;
      }

      if (orderData.includePackaging) {
        // Count pack items
        const packItemsCount = orderData.items.reduce((count, item) => {
          const product = products.find(p => p.id === item.product_id);
          if (product && product.type === 'pack') {
            return count + item.quantity;
          }
          return count;
        }, 0);
        packagingCharge = packItemsCount * 1.20;
        adminCost += packagingCharge;
      }

      // First create the order
      const { data: order, error: orderError } = await supabase
        .from('linen_orders')
        .insert([{
          customer_id: parseInt(orderData.customer_id),
          address_id: orderData.address_id,
          delivery_date: orderData.delivery_date || null,
          notes: orderData.notes,
          total_cost: totalCost,
          admin_cost: adminCost,
          delivery_charge: deliveryCharge,
          packaging_charge: packagingCharge,
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
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['linen-orders'] });
      setIsCreateDialogOpen(false);
      const profit = order.total_cost - order.admin_cost;
      toast({ 
        title: "Order created successfully",
        description: `Customer Total: £${order.total_cost.toFixed(2)} | Admin Cost: £${order.admin_cost.toFixed(2)} | Profit: £${profit.toFixed(2)}`
      });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error creating order", description: error.message, variant: "destructive" });
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // First delete order items
      const { error: itemsError } = await supabase
        .from('linen_order_items')
        .delete()
        .eq('order_id', orderId);
      
      if (itemsError) throw itemsError;

      // Then delete the order
      const { error: orderError } = await supabase
        .from('linen_orders')
        .delete()
        .eq('id', orderId);
      
      if (orderError) throw orderError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linen-orders'] });
      toast({ 
        title: "✅ Order Deleted", 
        description: "The order has been successfully deleted",
        className: "bg-green-50 border-green-200 text-green-800",
      });
    },
    onError: (error) => {
      toast({ 
        title: "Error deleting order", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      customer_id: "",
      address_id: "",
      delivery_date: "",
      notes: "",
      items: [],
      includeDelivery: false,
      includePackaging: false
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

  const getAdminCost = () => {
    let adminCost = 0;
    
    // Supplier costs
    formData.items.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        adminCost += item.quantity * (product.supplier_cost || 0);
      }
    });

    // Delivery charge
    if (formData.includeDelivery) {
      adminCost += 18;
    }

    // Packaging charge (only for pack items)
    if (formData.includePackaging) {
      const packItemsCount = formData.items.reduce((count, item) => {
        const product = products.find(p => p.id === item.product_id);
        if (product && product.type === 'pack') {
          return count + item.quantity;
        }
        return count;
      }, 0);
      adminCost += packItemsCount * 1.20;
    }

    return adminCost;
  };

  const getProfit = () => {
    return getTotalCost() - getAdminCost();
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

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      paid: "default",
      unpaid: "destructive",
      pending: "outline",
      refunded: "secondary"
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const openEditDialog = (order: any) => {
    setSelectedOrder(order);
    setIsEditDialogOpen(true);
  };

  const openDuplicateDialog = (order: any) => {
    setSelectedOrder(order);
    setIsDuplicateDialogOpen(true);
  };

  const openPaymentDialog = (order: any) => {
    setSelectedOrder(order);
    setIsPaymentDialogOpen(true);
  };

  const downloadOrderPDF = async (order: any) => {
    try {
      // Fetch order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('linen_order_items')
        .select(`
          *,
          linen_products (
            id,
            name,
            type,
            price
          )
        `)
        .eq('order_id', order.id);

      if (itemsError) throw itemsError;

      // Generate PDF
      const blob = await pdf(
        <LinenOrderPDF
          order={order}
          customer={order.customers}
          address={order.addresses}
          items={orderItems || []}
        />
      ).toBlob();

      // Download PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `linen-order-${order.id.slice(-8).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ 
        title: "PDF Downloaded",
        description: "Order invoice has been downloaded successfully"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ 
        title: "Error generating PDF", 
        description: error.message, 
        variant: "destructive" 
      });
    }
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
                    
                    <div className="pt-3 border-t space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Customer Total:</span>
                        <span className="text-lg font-bold text-green-600">£{getTotalCost().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Admin Cost:</span>
                        <span className="text-lg font-bold text-red-600">£{getAdminCost().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-2 border-t">
                        <span className="font-medium">Profit:</span>
                        <span className={`text-lg font-bold ${getProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          £{getProfit().toFixed(2)}
                        </span>
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

              {/* Additional Charges */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium text-sm">Admin Charges (Not charged to customer)</h4>
                
                {/* Delivery Charge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="delivery" className="text-sm font-normal">Include Delivery</Label>
                      <p className="text-xs text-muted-foreground">+£18.00 to admin cost</p>
                    </div>
                  </div>
                  <Switch
                    id="delivery"
                    checked={formData.includeDelivery}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeDelivery: checked }))}
                  />
                </div>

                {/* Packaging Charge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PackageCheck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="packaging" className="text-sm font-normal">Individual Packaging</Label>
                      <p className="text-xs text-muted-foreground">+£1.20 per pack item to admin cost</p>
                    </div>
                  </div>
                  <Switch
                    id="packaging"
                    checked={formData.includePackaging}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includePackaging: checked }))}
                  />
                </div>

                {/* Cost Breakdown */}
                {formData.items.length > 0 && (
                  <div className="pt-3 mt-3 border-t space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Supplier Cost:</span>
                      <span>£{formData.items.reduce((total, item) => {
                        const product = products.find(p => p.id === item.product_id);
                        return total + (product ? item.quantity * (product.supplier_cost || 0) : 0);
                      }, 0).toFixed(2)}</span>
                    </div>
                    {formData.includeDelivery && (
                      <div className="flex justify-between text-orange-600">
                        <span>+ Delivery:</span>
                        <span>£18.00</span>
                      </div>
                    )}
                    {formData.includePackaging && formData.items.some(item => {
                      const product = products.find(p => p.id === item.product_id);
                      return product?.type === 'pack';
                    }) && (
                      <div className="flex justify-between text-orange-600">
                        <span>+ Packaging ({formData.items.reduce((count, item) => {
                          const product = products.find(p => p.id === item.product_id);
                          return product?.type === 'pack' ? count + item.quantity : count;
                        }, 0)} packs):</span>
                        <span>£{(formData.items.reduce((count, item) => {
                          const product = products.find(p => p.id === item.product_id);
                          return product?.type === 'pack' ? count + item.quantity : count;
                        }, 0) * 1.20).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
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
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {orders.map((order: any) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base font-semibold">
                      Order #{order.id.slice(-8).toUpperCase()}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(order.status)}
                    {order.payment_status && getPaymentStatusBadge(order.payment_status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Info */}
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">
                      {order.customers?.first_name} {order.customers?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.customers?.email}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm">
                      {order.addresses?.address}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.addresses?.postcode}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Order Date</p>
                      <p className="text-sm font-medium">
                        {format(new Date(order.order_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Delivery</p>
                      <p className="text-sm font-medium">
                        {order.delivery_date 
                          ? format(new Date(order.delivery_date), 'MMM dd, yyyy')
                          : 'Not set'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment & Cost */}
                <div className="space-y-2 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Customer Total</p>
                        <p className="text-lg font-bold text-green-600">£{order.total_cost.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Admin Cost</p>
                        <p className="text-lg font-bold text-red-600">
                          £{(order.admin_cost || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <PaymentStatusIndicator 
                      status={order.payment_status || 'unpaid'} 
                      onClick={() => openPaymentDialog(order)}
                      isClickable={true}
                      size="lg"
                    />
                  </div>
                  {order.total_cost > 0 && order.admin_cost > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Profit:</span>
                      <span className={`font-medium ${
                        (order.total_cost - order.admin_cost) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        £{(order.total_cost - order.admin_cost).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 pt-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadOrderPDF(order)}
                    >
                      <FileDown className="h-4 w-4 mr-1" />
                      PDF
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(order)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openDuplicateDialog(order)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicate
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Order</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this order? This action cannot be undone and will remove the order and all associated items.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteOrderMutation.mutate(order.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteOrderMutation.isPending}
                          >
                            {deleteOrderMutation.isPending ? "Deleting..." : "Delete Order"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Order Dialog */}
      <EditOrderDialog 
        order={selectedOrder}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      {/* Duplicate Order Dialog */}
      <DuplicateLinenOrderDialog 
        order={selectedOrder}
        open={isDuplicateDialogOpen}
        onOpenChange={setIsDuplicateDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['linen-orders'] });
        }}
      />

      {/* Payment Dialog */}
      <ManualLinenPaymentDialog 
        order={selectedOrder}
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['linen-orders'] });
        }}
      />
    </div>
  );
};