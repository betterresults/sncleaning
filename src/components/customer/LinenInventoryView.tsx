import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Package2, PackageX } from 'lucide-react';
import { useLinenProducts } from '@/hooks/useLinenProducts';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const LinenInventoryView = () => {
  const { user } = useAuth();

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
  const { data: inventory } = useQuery({
    queryKey: ['customer-linen-inventory', profile?.customer_id],
    queryFn: async () => {
      if (!profile?.customer_id) return [];
      const { data } = await supabase
        .from('linen_inventory')
        .select(`
          *,
          linen_products (
            id,
            name,
            type,
            price
          ),
          addresses (
            address,
            postcode
          )
        `)
        .eq('customer_id', profile.customer_id);
      return data || [];
    },
    enabled: !!profile?.customer_id
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
  }, {} as Record<string, any>);

  const getStatusBadge = (clean: number, dirty: number, inUse: number) => {
    const total = clean + dirty + inUse;
    if (clean === total) return <Badge className="bg-green-100 text-green-800">All Clean</Badge>;
    if (dirty > 0) return <Badge variant="destructive">Needs Cleaning</Badge>;
    if (inUse > 0) return <Badge variant="secondary">In Use</Badge>;
    return <Badge variant="outline">Available</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Linen Inventory Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Package2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {inventory.reduce((sum, item) => sum + item.clean_quantity, 0)}
              </div>
              <div className="text-sm text-green-700">Clean Items</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">
                {inventory.reduce((sum, item) => sum + item.in_use_quantity, 0)}
              </div>
              <div className="text-sm text-blue-700">In Use</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <PackageX className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-600">
                {inventory.reduce((sum, item) => sum + item.dirty_quantity, 0)}
              </div>
              <div className="text-sm text-red-700">Dirty Items</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.entries(inventoryByAddress).map(([addressId, addressData]) => (
        <Card key={addressId}>
          <CardHeader>
            <CardTitle className="text-lg">
              {addressData.address?.address}, {addressData.address?.postcode}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {addressData.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.linen_products.name}</h4>
                    <p className="text-sm text-muted-foreground capitalize">
                      {item.linen_products.type}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {item.clean_quantity}
                      </div>
                      <div className="text-xs text-muted-foreground">Clean</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {item.in_use_quantity}
                      </div>
                      <div className="text-xs text-muted-foreground">In Use</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">
                        {item.dirty_quantity}
                      </div>
                      <div className="text-xs text-muted-foreground">Dirty</div>
                    </div>
                    
                    <div className="ml-4">
                      {getStatusBadge(item.clean_quantity, item.dirty_quantity, item.in_use_quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LinenInventoryView;