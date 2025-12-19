import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation, salesAgentNavigation } from '@/lib/navigationItems';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User, Eye, EyeOff, Camera, Building2, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const StaffSettings = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Profile state
  const [profileLoading, setProfileLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const STORAGE_KEY = 'staff_settings_bank_draft';

  // Initialize state from localStorage if available
  const getInitialProfileData = () => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch {
        return null;
      }
    }
    return null;
  };

  const [profileData, setProfileData] = useState(() => {
    const draft = getInitialProfileData();
    return draft || {
      first_name: '',
      last_name: '',
      email: '',
      profile_photo: '',
      bank_name: '',
      account_holder_name: '',
      sort_code: '',
      account_number: '',
      iban: ''
    };
  });

  // Track if initial load has happened
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Save form data to localStorage whenever it changes (for bank fields)
  useEffect(() => {
    // Only save if there's actual data entered
    if (profileData.bank_name || profileData.account_holder_name || 
        profileData.sort_code || profileData.account_number || profileData.iban) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profileData));
    }
  }, [profileData]);

  // Load profile data only once on mount (but don't override localStorage draft)
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id || initialLoadDone) return;

      const savedDraft = getInitialProfileData();
      const hasDraft = savedDraft && (savedDraft.bank_name || savedDraft.account_holder_name || 
                                       savedDraft.sort_code || savedDraft.account_number || savedDraft.iban);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfileData(prev => ({
          first_name: data.first_name || user?.user_metadata?.first_name || '',
          last_name: data.last_name || user?.user_metadata?.last_name || '',
          email: data.email || user?.email || '',
          profile_photo: data.profile_photo || '',
          // Preserve draft data if user was filling the form, otherwise use database values
          bank_name: hasDraft ? prev.bank_name : (data.bank_name || ''),
          account_holder_name: hasDraft ? prev.account_holder_name : (data.account_holder_name || ''),
          sort_code: hasDraft ? prev.sort_code : (data.sort_code || ''),
          account_number: hasDraft ? prev.account_number : (data.account_number || ''),
          iban: hasDraft ? prev.iban : (data.iban || '')
        }));
      } else if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      }
      setInitialLoadDone(true);
    };

    loadProfile();
  }, [user?.id, initialLoadDone]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      // Use upsert to create profile if it doesn't exist, or update if it does
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: profileData.email,
          bank_name: profileData.bank_name,
          account_holder_name: profileData.account_holder_name,
          sort_code: profileData.sort_code,
          account_number: profileData.account_number,
          iban: profileData.iban,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (profileError) {
        console.error('Profile upsert error:', profileError);
        throw profileError;
      }

      // Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: profileData.first_name,
          last_name: profileData.last_name
        }
      });

      if (authError) throw authError;

      // Clear the draft from localStorage after successful save
      localStorage.removeItem(STORAGE_KEY);

      toast({
        title: 'Success',
        description: 'Profile updated successfully!'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image must be less than 5MB',
        variant: 'destructive'
      });
      return;
    }

    setPhotoUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      // Update profile with photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_photo: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfileData(prev => ({ ...prev, profile_photo: publicUrl }));

      toast({
        title: 'Success',
        description: 'Profile photo updated successfully!'
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload photo. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setPhotoUploading(false);
    }
  };

  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'admin': return 'Administrator';
      case 'sales_agent': return 'Sales Agent';
      default: return 'Staff Member';
    }
  };

  const getNavigationItems = () => {
    if (userRole === 'sales_agent') return salesAgentNavigation;
    return adminNavigation;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading settings...</div>
      </div>
    );
  }

  // Allow admins and sales agents
  if (!user || (userRole !== 'admin' && userRole !== 'sales_agent')) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-gray-50">
        <UnifiedHeader 
          title=""
          user={user}
          userRole={userRole}
          onSignOut={handleSignOut}
        />
        <div className="flex flex-1 w-full">
          <UnifiedSidebar 
            navigationItems={getNavigationItems()}
            user={user}
            userRole={userRole}
            customerId={customerId}
            cleanerId={cleanerId}
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1">
            <main className="flex-1 p-2 sm:p-4 space-y-3 sm:space-y-4 w-full overflow-x-hidden">
              <div className="w-full px-1 sm:px-0 max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-[#185166] mb-6">My Profile</h1>
                
                {/* Profile Photo Section */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#185166]">
                      <Camera className="h-5 w-5" />
                      Profile Photo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profileData.profile_photo} alt="Profile photo" />
                      <AvatarFallback className="bg-[#18A5A5] text-white text-2xl">
                        {(profileData.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={photoUploading}
                        className="w-fit"
                      >
                        {photoUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Photo
                          </>
                        )}
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Max 5MB. Supports JPG, PNG, GIF
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Information */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#185166]">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="first_name">First Name</Label>
                          <Input 
                            id="first_name"
                            value={profileData.first_name}
                            onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                            placeholder="Enter first name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="last_name">Last Name</Label>
                          <Input 
                            id="last_name"
                            value={profileData.last_name}
                            onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                            placeholder="Enter last name"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input value={profileData.email} disabled className="bg-gray-50" />
                        <p className="text-sm text-muted-foreground mt-1">Email cannot be changed</p>
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Input value={getRoleDisplayName()} disabled className="bg-gray-50" />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-[#18A5A5] hover:bg-[#185166] text-white"
                        disabled={profileLoading}
                      >
                        {profileLoading ? 'Saving...' : 'Save Personal Information'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Bank Account Details */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#185166]">
                      <Building2 className="h-5 w-5" />
                      Bank Account Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div>
                        <Label htmlFor="bank_name">Bank Name</Label>
                        <Input 
                          id="bank_name"
                          value={profileData.bank_name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, bank_name: e.target.value }))}
                          placeholder="e.g. Barclays, HSBC, Lloyds"
                        />
                      </div>
                      <div>
                        <Label htmlFor="account_holder_name">Account Holder Name</Label>
                        <Input 
                          id="account_holder_name"
                          value={profileData.account_holder_name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, account_holder_name: e.target.value }))}
                          placeholder="Name as it appears on your bank account"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="sort_code">Sort Code</Label>
                          <Input 
                            id="sort_code"
                            value={profileData.sort_code}
                            onChange={(e) => setProfileData(prev => ({ ...prev, sort_code: e.target.value }))}
                            placeholder="00-00-00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="account_number">Account Number</Label>
                          <Input 
                            id="account_number"
                            value={profileData.account_number}
                            onChange={(e) => setProfileData(prev => ({ ...prev, account_number: e.target.value }))}
                            placeholder="8 digit account number"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="iban">IBAN (Optional)</Label>
                        <Input 
                          id="iban"
                          value={profileData.iban}
                          onChange={(e) => setProfileData(prev => ({ ...prev, iban: e.target.value }))}
                          placeholder="For international payments"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-[#18A5A5] hover:bg-[#185166] text-white"
                        disabled={profileLoading}
                      >
                        {profileLoading ? 'Saving...' : 'Save Bank Details'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Change Password */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#185166]">
                      <Lock className="h-5 w-5" />
                      Change Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="Enter new password"
                            required
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Confirm new password"
                            required
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-[#18A5A5] hover:bg-[#185166] text-white"
                        disabled={passwordLoading}
                      >
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StaffSettings;
