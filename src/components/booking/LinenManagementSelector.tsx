import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Package, Minus } from 'lucide-react';
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

  const getLinenIcon = (productName: string, productType: string) => {
    const name = productName?.toLowerCase() || '';
    const type = productType?.toLowerCase() || '';
    
    // Check for bed sizes first
    if (name.includes('king') || type.includes('king')) return '👑';
    if (name.includes('queen') || type.includes('queen')) return '♛'; 
    if (name.includes('double') || type.includes('double')) return '🛏️';
    if (name.includes('single') || type.includes('single')) return '🛌';
    
    // Then check for linen types
    if (type.includes('towel') || name.includes('towel')) return '🏊';
    if (type.includes('pillow') || name.includes('pillow')) return '🛌';  
    if (type.includes('duvet') || name.includes('duvet') || type.includes('comforter')) return '🌙';
    if (type.includes('sheet') || name.includes('sheet')) return '📋';
    
    // Default for bed linens
    return '🛡️';
  };

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

  const updateQuantity = (productId: string, newQuantity: number) => {
    handleUpdateQuantity(productId, newQuantity);
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

            {/* Product Selection */}
            {products.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Available Products:</Label>
                {products.map(product => {
                  const currentQuantity = linenUsed.find(item => item.product_id === product.id)?.quantity || 0;
                  
                  return (
                    <div key={product.id}>
                      <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                        <div className="text-xl">
                          {getLinenIcon(product.name, product.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {product.name.replace(/wash and iron/gi, '').trim()}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {product.type.replace(/wash and iron/gi, '').trim()} • £{product.price} each
                          </p>
                          {inventory.length > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              Available: {getAvailableQuantity(product.id)} clean
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(product.id, Math.max(0, currentQuantity - 1))}
                            disabled={currentQuantity <= 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="min-w-[2rem] text-center font-medium">
                            {currentQuantity}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(product.id, currentQuantity + 1)}
                            disabled={inventory.length > 0 && currentQuantity >= getAvailableQuantity(product.id)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary */}
            {linenUsed.length > 0 && (
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Total Items Selected:</Label>
                  <Badge variant="outline">{totalItemsUsed}</Badge>
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