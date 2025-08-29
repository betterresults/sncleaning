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

      const { data, error } = await supabase.functions.invoke('stripe-send-payment-link', {
        body: {
          order_id: orderId,
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'gbp',
          success_url: `${window.location.origin}/customer-linen-management?payment=success`,
          cancel_url: `${window.location.origin}/customer-linen-management?payment=cancelled`
        }
      });

      if (error) throw error;

      if (data?.payment_link) {
        // Open payment link in new tab
        window.open(data.payment_link, '_blank');
        toast({
          title: "Payment link opened",
          description: "Complete your payment in the new tab",
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
    return <Badge className="bg-green-100 text-green-800">All Clean</Badge>;
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
            <Card key={order.id} className="bg-white border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <ShoppingCart className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#185166]">Linen Order</h4>
                      <p className="text-sm text-muted-foreground">
                        {order.linen_order_items?.length || 0} items • £{Number(order.total_cost).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive">
                    {order.payment_status === 'unpaid' ? 'Unpaid' : 'Pending'}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Ordered: {new Date(order.order_date).toLocaleDateString()}</span>
                  </div>
                  {order.delivery_date && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Delivery: {new Date(order.delivery_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    size="sm"
                    className="bg-[#18A5A5] hover:bg-[#185166] text-white"
                    onClick={() => handlePayment(order.id, order.total_cost)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay £{Number(order.total_cost).toFixed(2)}
                  </Button>
                </div>
              </CardContent>
            </Card>
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
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h5 className="font-semibold text-[#185166]">{item.linen_products.name}</h5>
                          <p className="text-sm text-muted-foreground capitalize">
                            {item.linen_products.type}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-sm font-semibold text-green-600">
                              {item.clean_quantity}
                            </div>
                            <div className="text-xs text-muted-foreground">Clean</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm font-semibold text-blue-600">
                              {item.in_use_quantity}
                            </div>
                            <div className="text-xs text-muted-foreground">In Use</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm font-semibold text-red-600">
                              {item.dirty_quantity}
                            </div>
                            <div className="text-xs text-muted-foreground">Dirty</div>
                          </div>
                          
                          <div className="text-center border-l pl-4">
                            <div className="text-lg font-bold text-[#185166]">
                              {totalQuantity}
                            </div>
                            <div className="text-xs text-muted-foreground">Total</div>
                          </div>
                          
                          <div className="ml-4">
                            {getStatusBadge(item.clean_quantity, item.dirty_quantity, item.in_use_quantity)}
                          </div>
                        </div>
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