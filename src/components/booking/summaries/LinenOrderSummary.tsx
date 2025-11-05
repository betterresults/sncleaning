import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package2, BedDouble, BedSingle, Bath, Shirt, UtensilsCrossed } from 'lucide-react';

interface LinenOrderData {
  linenPackages: Record<string, number>;
  deliveryTiming?: string;
  totalCost: number;
}

interface LinenProduct {
  id: string;
  name: string;
  price: number;
  type?: string;
}

interface LinenOrderSummaryProps {
  data: LinenOrderData;
  linenProducts: LinenProduct[];
}

const getLinenIcon = (productName: string, type?: string) => {
  const name = productName.toLowerCase();
  if (name.includes('single') || name.includes('bed')) return BedSingle;
  if (name.includes('double') || name.includes('king')) return BedDouble;
  if (name.includes('bath') || name.includes('towel')) return Bath;
  if (name.includes('robe')) return Shirt;
  if (name.includes('tea')) return UtensilsCrossed;
  return Package2;
};

export const LinenOrderSummary: React.FC<LinenOrderSummaryProps> = ({ data, linenProducts }) => {
  const linenTotal = data.totalCost || 0;
  const hasReachedMinimum = linenTotal >= 150;
  const hasItems = Object.values(data.linenPackages || {}).some(qty => qty > 0);

  return (
    <Card className="p-6 sticky top-4 shadow-lg border bg-white">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <div className="w-10 h-10 bg-[#18A5A5]/10 rounded-lg flex items-center justify-center">
          <ShoppingCart className="h-5 w-5 text-[#18A5A5]" />
        </div>
        <h3 className="text-xl font-semibold text-[#185166]">Order Summary</h3>
      </div>

      {!hasItems ? (
        <div className="text-center py-8 text-gray-500">
          <Package2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Select linen packages to see your order summary</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Order Items */}
          <div className="space-y-3 pb-4 border-b">
            {Object.entries(data.linenPackages)
              .filter(([_, qty]) => qty > 0)
              .map(([pkgId, quantity]) => {
                const pkg = linenProducts.find(p => p.id === pkgId);
                if (!pkg) return null;
                const IconComponent = getLinenIcon(pkg.name, pkg.type);
                
                return (
                  <div key={pkgId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 flex-1">
                      <IconComponent className="h-4 w-4 text-[#18A5A5]" />
                      <span className="text-gray-700">{pkg.name}</span>
                      <span className="text-gray-500">x{quantity}</span>
                    </div>
                    <span className="font-semibold text-[#185166]">
                      £{(pkg.price * quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
          </div>

          {/* Delivery Timing */}
          {data.deliveryTiming && (
            <div className="pb-4 border-b">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery timing:</span>
                <span className="font-medium text-[#185166]">
                  {data.deliveryTiming === 'next-3-days' && 'Next 3 days'}
                  {data.deliveryTiming === 'next-7-days' && 'Next 7 days'}
                  {data.deliveryTiming === 'flexible' && 'Flexible'}
                </span>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-lg font-bold">
              <span className="text-[#185166]">Order Total:</span>
              <span className="text-[#18A5A5]">£{linenTotal.toFixed(2)}</span>
            </div>

            {!hasReachedMinimum && linenTotal > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 text-center">
                  <strong>Need £{(150 - linenTotal).toFixed(2)} more</strong> to reach £150 minimum
                </p>
              </div>
            )}

            {hasReachedMinimum && (
              <Badge className="w-full justify-center py-2 bg-green-100 text-green-800 hover:bg-green-100">
                ✓ Minimum order met
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

// Missing import
import { ShoppingCart } from 'lucide-react';
