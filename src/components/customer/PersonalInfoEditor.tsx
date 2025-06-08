
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Edit, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PersonalInfoEditor = () => {
  const { user, customerId } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('first_name, last_name, email, phone')
        .eq('id', customerId)
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
    if (!customerId) return;
    
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
        .eq('id', customerId);

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </div>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={customerData.first_name}
              onChange={(e) => setCustomerData({ ...customerData, first_name: e.target.value })}
              disabled={!isEditing}
              className={!isEditing ? 'bg-gray-50' : ''}
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={customerData.last_name}
              onChange={(e) => setCustomerData({ ...customerData, last_name: e.target.value })}
              disabled={!isEditing}
              className={!isEditing ? 'bg-gray-50' : ''}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={customerData.email}
            onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
            disabled={!isEditing}
            className={!isEditing ? 'bg-gray-50' : ''}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={customerData.phone}
            onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
            disabled={!isEditing}
            className={!isEditing ? 'bg-gray-50' : ''}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoEditor;
