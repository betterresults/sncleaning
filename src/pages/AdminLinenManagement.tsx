import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from '@/components/ui/sidebar';
import { UnifiedSidebar } from "@/components/UnifiedSidebar";
import { UnifiedHeader } from "@/components/UnifiedHeader";
import { adminNavigation } from "@/lib/navigationItems";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, BarChart3 } from "lucide-react";
import { LinenProductsManager } from "@/components/linen/LinenProductsManager";
import { LinenOrdersManager } from "@/components/linen/LinenOrdersManager";

const AdminLinenManagement = () => {
  const [activeTab, setActiveTab] = useState("products");
  const { user, signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full">
        <UnifiedSidebar 
          navigationItems={adminNavigation}
          user={user}
          onSignOut={signOut}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <UnifiedHeader 
            title="Linen Management"
            user={user}
            userRole="admin"
            onSignOut={signOut}
          />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Linen Management</h1>
              <p className="text-muted-foreground">Manage products, orders, and inventory</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="products" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Products
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Orders
                </TabsTrigger>
                <TabsTrigger value="inventory" className="flex items-center gap-2" disabled>
                  <BarChart3 className="h-4 w-4" />
                  Inventory
                  <span className="text-xs text-muted-foreground">(Coming Soon)</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="products">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Product Management
                    </CardTitle>
                    <CardDescription>
                      Create, edit, and manage linen products and their pricing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LinenProductsManager />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Order Management
                    </CardTitle>
                    <CardDescription>
                      View, create, and manage linen orders for customers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LinenOrdersManager />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inventory">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Inventory Management
                    </CardTitle>
                    <CardDescription>
                      Track linen inventory at customer properties (Coming Soon)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      Inventory management will be available after order creation is completed.
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLinenManagement;