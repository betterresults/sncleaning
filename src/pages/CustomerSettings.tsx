import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { customerNavigation } from '@/lib/navigationItems';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PersonalInfoEditor from '@/components/customer/PersonalInfoEditor';
import PaymentMethodManager from '@/components/customer/PaymentMethodManager';
import AddressManager from '@/components/customer/AddressManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, User, MapPin, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CustomerSettings = () => {
  const { user, userRole, customerId, signOut } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive'
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Password updated successfully!'
      });

      setPasswordData({
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: 'Error',
        description: 'Failed to update password. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user || (!customerId && userRole !== 'admin')) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-x-hidden">
        <UnifiedSidebar 
          navigationItems={customerNavigation}
          user={user}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1 overflow-x-hidden max-w-full">
          <UnifiedHeader 
            title="Settings ⚙️"
            user={user}
            userRole={userRole}
          />
          
          <main className="flex-1 w-full max-w-full overflow-x-hidden">
            <div className="p-2 sm:p-4 space-y-3 sm:space-y-4 max-w-full">
              <div className="max-w-6xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <p className="text-muted-foreground mt-2">Manage your account preferences and security</p>
                </div>

                <Tabs defaultValue="account" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-8 bg-white border-gray-100 shadow-sm rounded-2xl p-2">
                    <TabsTrigger 
                      value="account" 
                      className="flex items-center gap-2 data-[state=active]:bg-[#185166] data-[state=active]:text-white rounded-xl transition-all duration-300"
                    >
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">Account</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="addresses" 
                      className="flex items-center gap-2 data-[state=active]:bg-[#185166] data-[state=active]:text-white rounded-xl transition-all duration-300"
                    >
                      <MapPin className="h-4 w-4" />
                      <span className="hidden sm:inline">Addresses</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="payments" 
                      className="flex items-center gap-2 data-[state=active]:bg-[#185166] data-[state=active]:text-white rounded-xl transition-all duration-300"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span className="hidden sm:inline">Payments</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="account" className="space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {/* Personal Information */}
                      <div className="shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                        <PersonalInfoEditor />
                      </div>
                      
                      {/* Change Password */}
                      <Card className="bg-[#185166] shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                        <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3 text-white text-xl">
                          <div className="p-2 bg-[#18A5A5] rounded-lg border border-white/20 shadow-sm">
                            <Lock className="h-5 w-5 text-white" />
                          </div>
                          Change Password
                        </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handlePasswordChange} className="space-y-6">
                            <div className="space-y-2">
                              <Label htmlFor="newPassword" className="text-sm font-medium text-white">
                                New Password
                              </Label>
                              <div className="relative">
                                <Input
                                  id="newPassword"
                                  type={showPassword ? 'text' : 'password'}
                                  value={passwordData.newPassword}
                                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                  placeholder="Enter new password"
                                  required
                                  className="pr-10 border-white/20 bg-white/5 text-white placeholder:text-white/60 focus:border-[#18A5A5] focus:ring-[#18A5A5]/20 rounded-xl"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-white/60" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-white/60" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword" className="text-sm font-medium text-white">
                                Confirm New Password
                              </Label>
                              <div className="relative">
                                <Input
                                  id="confirmPassword"
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  value={passwordData.confirmPassword}
                                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                  placeholder="Confirm new password"
                                  required
                                  className="pr-10 border-white/20 bg-white/5 text-white placeholder:text-white/60 focus:border-[#18A5A5] focus:ring-[#18A5A5]/20 rounded-xl"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-white/60" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-white/60" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            <Button 
                              type="submit" 
                              className="w-full bg-[#18A5A5] hover:bg-[#185166] text-white font-medium py-3 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                              disabled={passwordLoading}
                            >
                              {passwordLoading ? 'Updating...' : 'Update Password'}
                            </Button>
                          </form>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="addresses" className="space-y-6">
                    <div className="shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                      <AddressManager />
                    </div>
                  </TabsContent>

                  <TabsContent value="payments" className="space-y-6">
                    <div className="shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                      <PaymentMethodManager />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CustomerSettings;