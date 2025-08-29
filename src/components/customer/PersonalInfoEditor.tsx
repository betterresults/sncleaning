
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Edit, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';

const PersonalInfoEditor = () => {
  const { user, customerId, userRole } = useAuth();
  const { selectedCustomerId } = useAdminCustomer();
  const { toast } = useToast();
  
  // Use selected customer ID if admin is viewing, otherwise use the logged-in user's customer ID
  const activeCustomerId = userRole === 'admin' ? selectedCustomerId : customerId;
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (activeCustomerId) {
      fetchCustomerData();
    }
  }, [activeCustomerId]);

  const fetchCustomerData = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('first_name, last_name, email, phone')
        .eq('id', activeCustomerId)
        .single();

      if (error) throw error;

      if (data) {
        setCustomerData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || ''
        });
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load personal information',
        variant: 'destructive'
      });
    }
  };

  const handleSave = async () => {
    if (!activeCustomerId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          email: customerData.email,
          phone: customerData.phone
        })
        .eq('id', activeCustomerId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Personal information updated successfully'
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating customer data:', error);
      toast({
        title: 'Error',
        description: 'Failed to update personal information',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchCustomerData(); // Reset to original data
  };

  return (
    <Card className="border-0">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-[#185166] text-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#18A5A5] rounded-lg border border-white/20 shadow-sm">
              <User className="h-5 w-5 text-white" />
            </div>
            Personal Information
          </div>
          {!isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="border-[#18A5A5] text-[#18A5A5] hover:bg-[#18A5A5] hover:text-white transition-all duration-300"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-[#185166]">First Name</Label>
            <Input
              id="firstName"
              value={customerData.first_name}
              onChange={(e) => setCustomerData({ ...customerData, first_name: e.target.value })}
              disabled={!isEditing}
              className={`border-gray-200 focus:border-[#18A5A5] focus:ring-[#18A5A5]/20 rounded-xl ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="text-sm font-medium text-[#185166]">Last Name</Label>
            <Input
              id="lastName"
              value={customerData.last_name}
              onChange={(e) => setCustomerData({ ...customerData, last_name: e.target.value })}
              disabled={!isEditing}
              className={`border-gray-200 focus:border-[#18A5A5] focus:ring-[#18A5A5]/20 rounded-xl ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-[#185166]">Email</Label>
          <Input
            id="email"
            type="email"
            value={customerData.email}
            onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
            disabled={!isEditing}
            className={`border-gray-200 focus:border-[#18A5A5] focus:ring-[#18A5A5]/20 rounded-xl ${!isEditing ? 'bg-gray-50' : ''}`}
          />
        </div>
        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-[#185166]">Phone Number</Label>
          <Input
            id="phone"
            value={customerData.phone}
            onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
            disabled={!isEditing}
            className={`border-gray-200 focus:border-[#18A5A5] focus:ring-[#18A5A5]/20 rounded-xl ${!isEditing ? 'bg-gray-50' : ''}`}
          />
        </div>
        
        {isEditing && (
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancel}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={loading}
              className="bg-[#18A5A5] hover:bg-[#185166] text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PersonalInfoEditor;
