import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import type { CustomerDetailAddressesTabProps } from './types';

export function CustomerDetailAddressesTab({ addresses }: CustomerDetailAddressesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Saved Addresses ({addresses.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {addresses.length > 0 ? (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div key={address.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{address.address}</span>
                      {address.is_default && <Badge variant="default">Default</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{address.postcode}</p>
                    {address.access && (
                      <p className="text-xs text-muted-foreground">Access: {address.access}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">No saved addresses</div>
        )}
      </CardContent>
    </Card>
  );
}
