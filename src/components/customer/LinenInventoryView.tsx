import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, DollarSign, Calendar, MapPin, CreditCard, PackageX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCustomerLinenOrders } from '@/hooks/useCustomerLinenOrders';

interface InventoryItem {
  id: string;
  address_id: string;
  product_id: string;
  customer_id: number;
  clean_quantity: number;
  dirty_quantity: number;
  in_use_quantity: number;
  last_updated: string;
  linen_products: {
    id: string;
    name: string;
    type: string;
    price: number;
  };
  addresses: {
    address: string;
    postcode: string;
  };
}

interface GroupedInventory {
  address: {
    address: string;
    postcode: string;
  };
  items: InventoryItem[];
}

const LinenInventoryView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { orders: linenOrders } = useCustomerLinenOrders();

  // Get customer profile and addresses
  const { data: profile } = useQuery({
    queryKey: ['customer-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user
  });

  const { data: addresses } = useQuery({
    queryKey: ['customer-addresses', profile?.customer_id],
    queryFn: async () => {
      if (!profile?.customer_id) return [];
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('customer_id', profile.customer_id)
        .order('is_default', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.customer_id
  });

  // Get inventory for all addresses
  const { data: inventory, isLoading: inventoryLoading, error: inventoryError } = useQuery({
    queryKey: ['customer-linen-inventory', profile?.customer_id],
    queryFn: async () => {
      if (!profile?.customer_id) {
        console.log('❌ No customer_id found in profile:', profile);
        return [];
      }
      
      console.log('🔍 Fetching linen inventory for customer_id:', profile.customer_id);
      
      // First, try a simple query to see if we get any data at all
      const { data: simpleData, error: simpleError } = await supabase
        .from('linen_inventory')
        .select('*')
        .eq('customer_id', profile.customer_id);
      
      console.log('📦 Simple inventory query result:', simpleData, 'Error:', simpleError);
      
      if (simpleError) {
        console.error('❌ Simple query error:', simpleError);
        throw simpleError;
      }
      
      if (!simpleData || simpleData.length === 0) {
        console.log('⚠️ No inventory found for customer_id:', profile.customer_id);
        return [];
      }
      
      // Now try the full query with joins
      const { data, error } = await supabase
        .from('linen_inventory')
        .select(`
          *,
          linen_products!inner (
            id,
            name,
            type,
            price
          ),
          addresses!inner (
            address,
            postcode
          )
        `)
        .eq('customer_id', profile.customer_id);
        
      console.log('🔗 Full inventory query result:', data, 'Error:', error);
      
      if (error) {
        console.error('❌ Full query error:', error);
        // Fallback to manual joins if the nested query fails
        const inventory = [];
        for (const item of simpleData) {
          const { data: product } = await supabase
            .from('linen_products')
            .select('id, name, type, price')
            .eq('id', item.product_id)
            .single();
            
          const { data: address } = await supabase
            .from('addresses')
            .select('address, postcode')
            .eq('id', item.address_id)
            .single();
            
          inventory.push({
            ...item,
            linen_products: product,
            addresses: address
          });
        }
        console.log('🔄 Fallback inventory result:', inventory);
        return inventory;
      }
      
      return data || [];
    },
    enabled: !!profile?.customer_id
  });
  
  console.log('📊 Final inventory state:', {
    hasProfile: !!profile,
    customerId: profile?.customer_id,
    inventoryLoading,
    inventoryError,
    inventoryCount: inventory?.length || 0,
    inventory: inventory
  });

  if (!inventory || inventory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Linen Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <PackageX className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No linen inventory found</p>
            <p className="text-sm">Your linen items will appear here once delivered</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group inventory by address
  const inventoryByAddress = inventory.reduce((acc, item) => {
    const addressKey = item.address_id;
    if (!acc[addressKey]) {
      acc[addressKey] = {
        address: item.addresses,
        items: []
      };
    }
    acc[addressKey].items.push(item);
    return acc;
  }, {} as Record<string, GroupedInventory>);

  const handlePayment = async (orderId: string, amount: number) => {
    try {
      toast({
        title: "Processing payment...",
        description: "Please wait while we set up your payment",
      });

      // Use the same payment flow as completed bookings
      const { data, error } = await supabase.functions.invoke('create-bulk-payment', {
        body: {
          bookings: [{
            id: orderId,
            amount: Math.round(amount * 100), // Convert to cents
            description: `Linen Order #${orderId.slice(0, 8).toUpperCase()}`
          }],
          totalAmount: Math.round(amount * 100)
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Payment processing",
          description: "You've been redirected to Stripe to complete your payment.",
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (clean: number, dirty: number, inUse: number) => {
    const total = clean + dirty + inUse;
    if (total === 0) return <Badge variant="outline">No Items</Badge>;
    if (dirty > 0) return <Badge variant="destructive">Needs Cleaning</Badge>;
    return null; // Remove "All Clean" badge
  };

  const unpaidOrders = linenOrders?.filter(order => 
    order.payment_status === 'unpaid' || order.payment_status === 'pending'
  ) || [];

  return (
    <div className="space-y-4">
      {/* Unpaid Orders Section */}
      {unpaidOrders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#185166] flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-red-500" />
            Unpaid Orders
          </h3>
          {unpaidOrders.map((order) => (
            <div key={order.id} className="group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 border-red-200 bg-red-50/30 hover:shadow-red-500/5">
              {/* Header with Order ID and Cost */}
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-[#185166] tracking-tight">
                      Linen Order #{order.id.slice(0, 8).toUpperCase()}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      {order.payment_status === 'unpaid' ? 'Unpaid' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="w-full h-px bg-border/40 mt-2"></div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600">£{Number(order.total_cost).toFixed(2)}</div>
                </div>
              </div>
              
              {/* Order Details */}
              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Ordered: {new Date(order.order_date).toLocaleDateString('en-GB')}</span>
                </div>
                {order.delivery_date && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Delivery: {new Date(order.delivery_date).toLocaleDateString('en-GB')}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="mb-4">
                <h4 className="font-medium text-[#185166] mb-3">Items:</h4>
                <div className="space-y-2">
                  {order.linen_order_items?.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-[#185166]">{item.linen_products.name}</span>
                      <span className="font-medium">£{Number(item.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                  {(order.linen_order_items?.length || 0) > 2 && (
                    <div className="text-sm text-muted-foreground">
                      + {(order.linen_order_items?.length || 0) - 2} more items
                    </div>
                  )}
                </div>
              </div>

              {/* Pay Button */}
              <div className="flex justify-end">
                <Button 
                  size="sm"
                  className="bg-[#18A5A5] hover:bg-[#185166] text-white"
                  onClick={() => handlePayment(order.id, order.total_cost)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Linen Inventory Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[#185166] flex items-center gap-2">
          <Package className="h-5 w-5" />
          Linen Inventory
        </h3>

        {!inventory || inventory.length === 0 ? (
          <Card className="bg-white border-gray-100 hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 text-center">
              <PackageX className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">No linen inventory found</p>
              <p className="text-sm text-muted-foreground">Your linen items will appear here once delivered</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(inventoryByAddress).map(([addressId, addressData]: [string, GroupedInventory]) => (
            <Card key={addressId} className="bg-white border-gray-100 hover:shadow-md transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#185166]">
                        {addressData.address?.address}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {addressData.address?.postcode}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {addressData.items.map((item: InventoryItem) => {
                    const totalQuantity = item.clean_quantity + item.dirty_quantity + item.in_use_quantity;
                    return (
                      <div key={item.id} className="hover:shadow-lg transition-all duration-200 border-2 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">
                              {item.linen_products.type?.toLowerCase().includes('towel') ? '🏊' : 
                               item.linen_products.name?.toLowerCase().includes('bath mat') ? '🛁' : '🛏️'}
                            </div>
                            <div>
                              <h5 className="text-lg font-bold text-[#185166]">
                                {item.linen_products.name?.replace(/\bset\b/gi, '').trim()}
                              </h5>
                              <p className="text-sm font-medium text-muted-foreground capitalize">
                                {item.linen_products.type} • £{item.linen_products.price?.toFixed(2)} each
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#185166]">
                              {totalQuantity} Total
                            </div>
                            <div className="text-xs text-muted-foreground">
                              £{(totalQuantity * (item.linen_products.price || 0)).toFixed(2)} value
                            </div>
                          </div>
                        </div>
                        
                        {/* Colorful quantity boxes */}
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
                        
                        {getStatusBadge(item.clean_quantity, item.dirty_quantity, item.in_use_quantity) && (
                          <div className="mt-3 flex justify-center">
                            {getStatusBadge(item.clean_quantity, item.dirty_quantity, item.in_use_quantity)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default LinenInventoryView;