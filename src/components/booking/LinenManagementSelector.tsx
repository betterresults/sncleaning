import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Package } from 'lucide-react';
import { useLinenProducts, LinenUsageItem } from '@/hooks/useLinenProducts';
import { useToast } from '@/hooks/use-toast';

interface LinenManagementSelectorProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  linenUsed: LinenUsageItem[];
  onLinenUsedChange: (linenUsed: LinenUsageItem[]) => void;
  customerId?: number;
  addressId?: string;
}

const LinenManagementSelector = ({
  enabled,
  onEnabledChange,
  linenUsed,
  onLinenUsedChange,
  customerId,
  addressId
}: LinenManagementSelectorProps) => {
  const { products, inventory, loading, getAvailableQuantity, getProductById } = useLinenProducts(customerId, addressId);
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  const handleAddLinenItem = () => {
    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive",
      });
      return;
    }

    const product = getProductById(selectedProduct);
    if (!product) return;

    const availableQuantity = getAvailableQuantity(selectedProduct);
    const alreadyUsedQuantity = linenUsed.find(item => item.product_id === selectedProduct)?.quantity || 0;
    const totalRequestedQuantity = alreadyUsedQuantity + selectedQuantity;

    if (totalRequestedQuantity > availableQuantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${availableQuantity} ${product.name} available in clean inventory. You already have ${alreadyUsedQuantity} selected.`,
        variant: "destructive",
      });
      return;
    }

    const existingIndex = linenUsed.findIndex(item => item.product_id === selectedProduct);
    
    if (existingIndex >= 0) {
      // Update existing item
      const updatedLinenUsed = [...linenUsed];
      updatedLinenUsed[existingIndex].quantity += selectedQuantity;
      onLinenUsedChange(updatedLinenUsed);
    } else {
      // Add new item
      const newItem: LinenUsageItem = {
        product_id: selectedProduct,
        quantity: selectedQuantity,
        product_name: product.name
      };
      onLinenUsedChange([...linenUsed, newItem]);
    }

    setSelectedProduct('');
    setSelectedQuantity(1);
  };

  const handleRemoveLinenItem = (productId: string) => {
    onLinenUsedChange(linenUsed.filter(item => item.product_id !== productId));
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveLinenItem(productId);
      return;
    }

    const availableQuantity = getAvailableQuantity(productId);
    if (newQuantity > availableQuantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${availableQuantity} items available in clean inventory`,
        variant: "destructive",
      });
      return;
    }

    const updatedLinenUsed = linenUsed.map(item =>
      item.product_id === productId
        ? { ...item, quantity: newQuantity }
        : item
    );
    onLinenUsedChange(updatedLinenUsed);
  };

  const totalItemsUsed = linenUsed.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Linen Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="linenManagement"
            checked={enabled}
            onCheckedChange={onEnabledChange}
          />
          <Label htmlFor="linenManagement" className="text-sm font-medium">
            Enable Linen Management for this booking
          </Label>
        </div>

        {enabled && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">
              Select which linen products will be used in this cleaning. Items will be moved from clean to dirty inventory when the booking is completed.
            </div>

            {/* Add Linen Item Section */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="productSelect" className="text-xs">Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger id="productSelect">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {loading ? (
                      <SelectItem value="loading" disabled>Loading products...</SelectItem>
                    ) : products.length === 0 ? (
                      <SelectItem value="no-products" disabled>No products available</SelectItem>
                    ) : (
                      products.map(product => {
                        const available = getAvailableQuantity(product.id);
                        const alreadyUsed = linenUsed.find(item => item.product_id === product.id)?.quantity || 0;
                        const remainingAvailable = available - alreadyUsed;
                        
                        return (
                          <SelectItem 
                            key={product.id} 
                            value={product.id}
                            disabled={remainingAvailable <= 0}
                          >
                            {product.name} ({remainingAvailable} available)
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20">
                <Label htmlFor="quantityInput" className="text-xs">Qty</Label>
                <Input
                  id="quantityInput"
                  type="number"
                  min="1"
                  max={selectedProduct ? getAvailableQuantity(selectedProduct) : 999}
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <Button 
                type="button"
                onClick={handleAddLinenItem}
                disabled={!selectedProduct}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected Linen Items */}
            {linenUsed.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Items ({totalItemsUsed} total):</Label>
                <div className="space-y-2">
                  {linenUsed.map(item => (
                    <div key={item.product_id} className="flex items-center gap-2 p-2 bg-background rounded border">
                      <div className="flex-1">
                        <span className="font-medium">{item.product_name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({getAvailableQuantity(item.product_id)} available)
                        </span>
                      </div>
                      <div className="w-16">
                        <Input
                          type="number"
                          min="1"
                          max={getAvailableQuantity(item.product_id)}
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.product_id, parseInt(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLinenItem(item.product_id)}
                        className="text-destructive hover:text-destructive p-1 h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inventory Status */}
            {inventory.length > 0 && (
              <div className="pt-2 border-t">
                <Label className="text-xs text-muted-foreground">Current Inventory Status:</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {inventory.map(item => (
                    <div key={item.product_id} className="text-xs p-2 bg-background rounded border">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-muted-foreground">
                        Clean: {item.clean_quantity} | Dirty: {item.dirty_quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LinenManagementSelector;