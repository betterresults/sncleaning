import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LinenProduct {
  id: string;
  name: string;
  type: string;
  description?: string;
  price: number;
  supplier_cost: number;
}

interface LinenInventory {
  product_id: string;
  clean_quantity: number;
  dirty_quantity: number;
  product: LinenProduct;
}

export interface LinenUsageItem {
  product_id: string;
  quantity: number;
  product_name: string;
}

export const useLinenProducts = (customerId?: number, addressId?: string) => {
  const [products, setProducts] = useState<LinenProduct[]>([]);
  const [inventory, setInventory] = useState<LinenInventory[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('linen_products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching linen products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch linen products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    if (!customerId || !addressId) return;

    try {
      const { data, error } = await supabase
        .from('linen_inventory')
        .select(`
          product_id,
          clean_quantity,
          dirty_quantity,
          linen_products!inner (
            id,
            name,
            type,
            description,
            price,
            supplier_cost
          )
        `)
        .eq('customer_id', customerId)
        .eq('address_id', addressId);

      if (error) throw error;
      
      const formattedInventory = data?.map(item => ({
        ...item,
        product: item.linen_products
      })) || [];
      
      setInventory(formattedInventory);
    } catch (error) {
      console.error('Error fetching linen inventory:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (customerId && addressId) {
      fetchInventory();
    }
  }, [customerId, addressId]);

  const getAvailableQuantity = (productId: string): number => {
    const inventoryItem = inventory.find(item => item.product_id === productId);
    return inventoryItem?.clean_quantity || 0;
  };

  const getProductById = (productId: string): LinenProduct | undefined => {
    return products.find(product => product.id === productId);
  };

  return {
    products,
    inventory,
    loading,
    refetch: fetchProducts,
    refetchInventory: fetchInventory,
    getAvailableQuantity,
    getProductById
  };
};