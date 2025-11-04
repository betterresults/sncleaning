import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LinenOrderData } from '@/../sn-cleaning-booking-forms-main/src/components/booking/LinenOrderForm';

export const useLinenOrderSubmit = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submitLinenOrder = async (orderData: LinenOrderData) => {
    setLoading(true);
    
    try {
      let customerId = orderData.customerId;
      let addressId = orderData.addressId;

      // 1. Create or get customer if not exists
      if (!customerId) {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', orderData.email)
          .single();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
              first_name: orderData.firstName,
              last_name: orderData.lastName,
              email: orderData.email,
              phone: orderData.phone,
              client_status: 'New'
            })
            .select('id')
            .single();

          if (customerError) throw customerError;
          customerId = newCustomer.id;
        }
      }

      // 2. Create or get address
      if (!addressId && orderData.postcode) {
        const fullAddress = [
          orderData.houseNumber,
          orderData.street,
          orderData.city,
          orderData.postcode
        ].filter(Boolean).join(', ');

        const { data: existingAddress } = await supabase
          .from('addresses')
          .select('id')
          .eq('customer_id', customerId)
          .eq('postcode', orderData.postcode)
          .single();

        if (existingAddress) {
          addressId = existingAddress.id;
        } else {
          const { data: newAddress, error: addressError } = await supabase
            .from('addresses')
            .insert({
              customer_id: customerId,
              address: fullAddress,
              postcode: orderData.postcode
            })
            .select('id')
            .single();

          if (addressError) throw addressError;
          addressId = newAddress.id;
        }
      }

      // 3. Create linen order
      const { data: order, error: orderError } = await supabase
        .from('linen_orders')
        .insert({
          customer_id: customerId,
          address_id: addressId,
          total_cost: orderData.totalCost,
          delivery_timing: orderData.deliveryTiming,
          delivery_notes: orderData.deliveryNotes,
          status: 'pending',
          payment_status: 'pending',
          payment_method: orderData.paymentMethod || 'card'
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      // 4. Create order items
      const orderItems = Object.entries(orderData.linenPackages)
        .filter(([_, qty]) => qty > 0)
        .map(([productId, quantity]) => ({
          order_id: order.id,
          product_id: productId,
          quantity: quantity,
          // Unit price will be filled by trigger or we can fetch it
        }));

      if (orderItems.length > 0) {
        // Fetch product prices
        const { data: products } = await supabase
          .from('linen_products')
          .select('id, price')
          .in('id', orderItems.map(item => item.product_id));

        const itemsWithPrices = orderItems.map(item => {
          const product = products?.find(p => p.id === item.product_id);
          return {
            ...item,
            unit_price: product?.price || 0
          };
        });

        const { error: itemsError } = await supabase
          .from('linen_order_items')
          .insert(itemsWithPrices);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Order placed successfully!",
        description: "We'll contact you within 24 hours to confirm delivery.",
      });

      return { 
        success: true, 
        orderId: order.id,
        customerId,
        addressId 
      };
      
    } catch (error: any) {
      console.error('Error submitting linen order:', error);
      
      toast({
        title: "Error placing order",
        description: error.message || "Failed to submit order. Please try again.",
        variant: "destructive",
      });

      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      setLoading(false);
    }
  };

  return { submitLinenOrder, loading };
};
