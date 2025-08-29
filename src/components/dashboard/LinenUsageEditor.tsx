import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, X } from 'lucide-react';
import { useLinenProducts } from '@/hooks/useLinenProducts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LinenUsageItem {
  product_id: string;
  product_name: string;
  quantity: number;
}

interface LinenUsageEditorProps {
  value: LinenUsageItem[];
  onChange: (value: LinenUsageItem[]) => void;
}

export const LinenUsageEditor: React.FC<LinenUsageEditorProps> = ({
  value = [],
  onChange,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const { products, loading } = useLinenProducts();

  const addLinenItem = () => {
    if (!selectedProductId) return;
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    // Check if product already exists
    if (value.some(item => item.product_id === selectedProductId)) {
      return;
    }

    const newItem: LinenUsageItem = {
      product_id: selectedProductId,
      product_name: product.name,
      quantity: 1
    };

    onChange([...value, newItem]);
    setSelectedProductId('');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    const updatedValue = value.map(item =>
      item.product_id === productId
        ? { ...item, quantity }
        : item
    );
    onChange(updatedValue);
  };

  const removeItem = (productId: string) => {
    const updatedValue = value.filter(item => item.product_id !== productId);
    onChange(updatedValue);
  };

  const availableProducts = products.filter(
    product => !value.some(item => item.product_id === product.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Linen Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new linen item */}
        <div className="flex gap-2">
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select linen product..." />
            </SelectTrigger>
            <SelectContent>
              {availableProducts.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} - £{product.price}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={addLinenItem} 
            disabled={!selectedProductId || loading}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Current linen items */}
        <div className="space-y-2">
          {value.map((item) => (
            <div key={item.product_id} className="flex items-center gap-2 p-2 border rounded-lg">
              <Badge variant="secondary" className="flex-1">
                {item.product_name}
              </Badge>
              
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                  className="w-16 text-center"
                />
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => removeItem(item.product_id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        {value.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            No linen items selected. Add items above.
          </p>
        )}

        {value.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600">
              Total items: {value.reduce((sum, item) => sum + item.quantity, 0)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};