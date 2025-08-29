import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LinenOrder {
  id: string;
  order_date: string;
  delivery_date?: string;
  pickup_date?: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  total_cost: number;
  notes?: string;
  linen_order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    linen_products: {
      id: string;
      name: string;
      type: string;
      price: number;
    };
  }[];
}

export const useCustomerLinenOrders = () => {
  const [orders, setOrders] = useState<LinenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get customer profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.customer_id) return;

      // Fetch orders with items and products
      const { data, error } = await supabase
        .from('linen_orders')
        .select(`
          id,
          order_date,
          delivery_date,
          pickup_date,
          status,
          payment_status,
          payment_method,
          total_cost,
          notes,
          linen_order_items (
            id,
            quantity,
            unit_price,
            subtotal,
            linen_products (
              id,
              name,
              type,
              price
            )
          )
        `)
        .eq('customer_id', profile.customer_id)
        .order('order_date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching linen orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch linen orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: {
    addressId: string;
    items: { productId: string; quantity: number }[];
    deliveryDate?: string;
    pickupDate?: string;
    notes?: string;
  }) => {
    if (!user) return;

    try {
      // Get customer profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.customer_id) throw new Error('Customer profile not found');

      // Calculate total cost and validate minimum
      let totalCost = 0;
      const enrichedItems = [];

      for (const item of orderData.items) {
        const { data: product } = await supabase
          .from('linen_products')
          .select('price')
          .eq('id', item.productId)
          .single();

        if (!product) throw new Error(`Product not found: ${item.productId}`);

        const itemCost = product.price * item.quantity;
        totalCost += itemCost;
        enrichedItems.push({
          ...item,
          unitPrice: product.price,
          subtotal: itemCost
        });
      }

      // Check minimum order value
      if (totalCost < 150) {
        toast({
          title: "Minimum Order Required",
          description: "We have a minimum charge of £150 for linen orders. Please add more items to meet this requirement.",
          variant: "destructive",
        });
        return false;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('linen_orders')
        .insert({
          customer_id: profile.customer_id,
          address_id: orderData.addressId,
          delivery_date: orderData.deliveryDate,
          pickup_date: orderData.pickupDate,
          notes: orderData.notes,
          total_cost: totalCost,
          status: 'scheduled',
          payment_status: 'unpaid'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = enrichedItems.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal
      }));

      const { error: itemsError } = await supabase
        .from('linen_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Order Created",
        description: `Your linen order has been created successfully. Total: £${totalCost.toFixed(2)}`,
      });

      fetchOrders(); // Refresh orders
      return true;
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create linen order",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  return {
    orders,
    loading,
    refetch: fetchOrders,
    createOrder
  };
};