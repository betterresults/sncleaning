import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Package, CheckCircle, Clock, Truck } from 'lucide-react';
import { useCustomerLinenOrders } from '@/hooks/useCustomerLinenOrders';
import { CreateLinenOrderDialog } from './CreateLinenOrderDialog';
import { format } from 'date-fns';

const LinenOrdersView = () => {
  const { orders, loading, refetch } = useCustomerLinenOrders();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'delivered':
        return <Truck className="h-4 w-4" />;
      case 'picked_up':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case 'picked_up':
        return <Badge variant="outline">Picked Up</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'unpaid':
        return <Badge variant="destructive">Unpaid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading orders...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Linen Orders
            </CardTitle>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Order
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No linen orders found</p>
              <p className="text-sm">Create your first linen order to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 lg:gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {getStatusIcon(order.status)}
                          <h4 className="font-semibold text-lg text-[#185166]">
                            Order #{order.id.slice(-8)}
                          </h4>
                          {getStatusBadge(order.status)}
                          {getPaymentStatusBadge(order.payment_status)}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Order:</span>
                            <span className="font-medium">{format(new Date(order.order_date), 'dd MMM yyyy')}</span>
                          </div>
                          {order.delivery_date && (
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Delivery:</span>
                              <span className="font-medium">{format(new Date(order.delivery_date), 'dd MMM yyyy')}</span>
                            </div>
                          )}
                          {order.pickup_date && (
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Pickup:</span>
                              <span className="font-medium">{format(new Date(order.pickup_date), 'dd MMM yyyy')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="lg:text-right">
                        <div className="text-2xl font-bold text-[#185166]">
                          £{order.total_cost.toFixed(2)}
                        </div>
                        {order.payment_method && (
                          <div className="text-sm text-muted-foreground capitalize">
                            {order.payment_method}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <h5 className="font-semibold text-[#185166]">Items:</h5>
                      <div className="grid gap-2">
                        {order.linen_order_items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div className="flex-1">
                              <span className="font-medium text-[#185166]">{item.linen_products.name}</span>
                              <span className="text-muted-foreground ml-2 text-sm">
                                ({item.linen_products.type})
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">Qty: <span className="font-medium text-[#185166]">{item.quantity}</span></span>
                              <span className="text-muted-foreground">Unit: <span className="font-medium text-[#185166]">£{item.unit_price.toFixed(2)}</span></span>
                              <span className="font-semibold text-[#185166]">£{item.subtotal.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Notes:</strong> {order.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateLinenOrderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onOrderCreated={() => {
          refetch();
          setShowCreateDialog(false);
        }}
      />
    </div>
  );
};

export default LinenOrdersView;