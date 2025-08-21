import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, UserCheck, AlertTriangle, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RecordStatus {
  customers: {
    total: number;
    withAccounts: number;
    withoutAccounts: number;
  };
  cleaners: {
    total: number;
    withAccounts: number;
    withoutAccounts: number;
  };
}

const BulkAccountCreationUtility = () => {
  const [status, setStatus] = useState<RecordStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const { toast } = useToast();

  const checkSystemStatus = async () => {
    setCheckingStatus(true);
    try {
      // Get all customers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, email')
        .not('email', 'is', null)
        .neq('email', '');

      if (customersError) throw customersError;

      // Get all cleaners
      const { data: cleaners, error: cleanersError } = await supabase
        .from('cleaners')
        .select('id, email')
        .not('email', 'is', null)
        .neq('email', '');

      if (cleanersError) throw cleanersError;

      // Get all profiles with customer_id
      const { data: customerProfiles, error: customerProfilesError } = await supabase
        .from('profiles')
        .select('customer_id')
        .not('customer_id', 'is', null);

      if (customerProfilesError) throw customerProfilesError;

      // Get all profiles with cleaner_id
      const { data: cleanerProfiles, error: cleanerProfilesError } = await supabase
        .from('profiles')
        .select('cleaner_id')
        .not('cleaner_id', 'is', null);

      if (cleanerProfilesError) throw cleanerProfilesError;

      const linkedCustomerIds = new Set(customerProfiles.map(p => p.customer_id));
      const linkedCleanerIds = new Set(cleanerProfiles.map(p => p.cleaner_id));

      const statusData: RecordStatus = {
        customers: {
          total: customers.length,
          withAccounts: customers.filter(c => linkedCustomerIds.has(c.id)).length,
          withoutAccounts: customers.filter(c => !linkedCustomerIds.has(c.id)).length,
        },
        cleaners: {
          total: cleaners.length,
          withAccounts: cleaners.filter(c => linkedCleanerIds.has(c.id)).length,
          withoutAccounts: cleaners.filter(c => !linkedCleanerIds.has(c.id)).length,
        }
      };

      setStatus(statusData);
    } catch (error) {
      console.error('Error checking system status:', error);
      toast({
        title: "Error",
        description: "Failed to check system status",
        variant: "destructive",
      });
    } finally {
      setCheckingStatus(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSystemStatus();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          System Status Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            This dashboard shows the current state of your user data linking system. 
            All customers and cleaners should have linked authentication accounts.
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Checking system status...</span>
            </div>
          ) : status ? (
            <div className="space-y-6">
              {/* Status Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Customers
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Records:</span>
                      <Badge variant="outline">{status.customers.total}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">With Login Access:</span>
                      <Badge variant="default" className="bg-green-600">
                        {status.customers.withAccounts}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Missing Login:</span>
                      <Badge variant="destructive">
                        {status.customers.withoutAccounts}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Cleaners
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Records:</span>
                      <Badge variant="outline">{status.cleaners.total}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">With Login Access:</span>
                      <Badge variant="default" className="bg-green-600">
                        {status.cleaners.withAccounts}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Missing Login:</span>
                      <Badge variant="destructive">
                        {status.cleaners.withoutAccounts}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Issues Alert */}
              {(status.customers.withoutAccounts > 0 || status.cleaners.withoutAccounts > 0) && (
                <div className="flex items-start gap-2 p-4 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="space-y-2">
                    <div className="font-medium text-yellow-700">
                      System Issues Detected
                    </div>
                    <div className="text-sm text-yellow-700 space-y-1">
                      {status.customers.withoutAccounts > 0 && (
                        <div>• {status.customers.withoutAccounts} customers cannot log in</div>
                      )}
                      {status.cleaners.withoutAccounts > 0 && (
                        <div>• {status.cleaners.withoutAccounts} cleaners cannot log in</div>
                      )}
                      <div className="mt-2">
                        <strong>Action needed:</strong> Use the Bulk Link Records utility below to fix these issues.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {status.customers.withoutAccounts === 0 && status.cleaners.withoutAccounts === 0 && status.customers.total > 0 && (
                <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  <div className="text-sm text-green-700">
                    <strong>System Status: Healthy</strong> - All users have proper login access.
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <Button 
            onClick={checkSystemStatus}
            disabled={checkingStatus}
            variant="outline"
            size="sm"
          >
            {checkingStatus ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              'Refresh Status'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkAccountCreationUtility;