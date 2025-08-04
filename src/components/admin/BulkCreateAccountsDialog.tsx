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

export const BulkCreateAccountsDialog = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkCreateResult[]>([]);
  const [errors, setErrors] = useState<BulkCreateError[]>([]);
  const { toast } = useToast();

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
            This will create user accounts for all customers who don't have one yet and send them welcome emails with login details.
          </div>

          <Button 
            onClick={handleBulkCreate} 
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Accounts...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Create All Customer Accounts
              </>
            )}
          </Button>

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