import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BulkCreateResult {
  customer_id: number;
  email: string;
  user_id: string;
  status: string;
}

interface BulkCreateError {
  customer_id: number;
  email: string;
  error: string;
}

interface TestCustomerResult {
  customer_id: number;
  email: string;
  user_id: string;
  temp_password: string;
}

export const BulkCreateAccountsDialog = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [results, setResults] = useState<BulkCreateResult[]>([]);
  const [errors, setErrors] = useState<BulkCreateError[]>([]);
  const [testResult, setTestResult] = useState<TestCustomerResult | null>(null);
  const { toast } = useToast();

  const handleTestWithOneCustomer = async () => {
    setTestLoading(true);
    setTestResult(null);

    try {
      // Get one customer without an account
      const { data: customers, error: fetchError } = await supabase
        .from('customers')
        .select(`
          id, first_name, last_name, email,
          profiles!left(customer_id)
        `)
        .is('profiles.customer_id', null)
        .limit(1);

      if (fetchError || !customers || customers.length === 0) {
        toast({
          title: "No Test Customer Found",
          description: "All customers already have accounts or there was an error fetching data.",
          variant: "destructive",
        });
        return;
      }

      const testCustomer = customers[0];

      const { data, error } = await supabase.functions.invoke('bulk-create-customer-accounts', {
        body: {
          customer_ids: [testCustomer.id],
          send_emails: true
        }
      });

      if (error) {
        throw error;
      }

      if (data.results && data.results.length > 0) {
        setTestResult(data.results[0]);
        toast({
          title: "Test Successful! 🎉",
          description: `Test email sent to ${testCustomer.email}. Check if they received it!`,
        });
      } else {
        throw new Error("No results returned from test");
      }

    } catch (error) {
      console.error('Error testing with one customer:', error);
      toast({
        title: "Test Failed",
        description: "Failed to create test account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleBulkCreate = async () => {
    setLoading(true);
    setResults([]);
    setErrors([]);

    try {
      const { data, error } = await supabase.functions.invoke('bulk-create-customer-accounts', {
        body: {
          send_emails: true
        }
      });

      if (error) {
        throw error;
      }

      setResults(data.results || []);
      setErrors(data.errors || []);

      toast({
        title: "Bulk Account Creation Complete",
        description: `Created ${data.created_accounts} accounts successfully. ${data.errors?.length || 0} errors.`,
      });

    } catch (error) {
      console.error('Error creating bulk accounts:', error);
      toast({
        title: "Error",
        description: "Failed to create customer accounts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          Bulk Create Customer Accounts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Accounts for All Customers</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            This will create user accounts for customers and send them beautiful welcome emails with login details.
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleTestWithOneCustomer} 
              disabled={testLoading || loading}
              variant="outline"
              className="gap-2 w-full"
            >
              {testLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing with One Customer...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  🧪 Test with One Customer First
                </>
              )}
            </Button>

            <Button 
              onClick={handleBulkCreate} 
              disabled={loading || testLoading}
              className="gap-2 w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating All Accounts...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  🚀 Create ALL Customer Accounts
                </>
              )}
            </Button>
          </div>

          {testResult && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">✅ Test Completed Successfully!</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Customer:</strong> {testResult.email}</p>
                  <p><strong>Password:</strong> <code className="bg-green-100 px-2 py-1 rounded">{testResult.temp_password}</code></p>
                  <p className="text-xs mt-2">Check if the customer received the welcome email before proceeding with bulk creation.</p>
                </div>
              </div>
            </div>
          )}

          {(results.length > 0 || errors.length > 0) && (
            <div className="space-y-4">
              {results.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-700 mb-2">
                    Successfully Created ({results.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {results.map((result) => (
                      <div key={result.customer_id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="text-sm">{result.email}</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Account Created
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-2">
                    Errors ({errors.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {errors.map((error) => (
                      <div key={error.customer_id} className="p-2 bg-red-50 rounded">
                        <div className="text-sm font-medium">{error.email}</div>
                        <div className="text-xs text-red-600">{error.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};