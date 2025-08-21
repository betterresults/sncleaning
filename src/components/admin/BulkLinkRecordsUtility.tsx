import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, UserCheck, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface LinkingResult {
  success: boolean;
  message: string;
  recordType: 'customer' | 'cleaner';
  recordId: number;
  userId?: string;
  error?: string;
}

interface LinkingSummary {
  total: number;
  successful: number;
  failed: number;
  customers: {
    successful: number;
    failed: number;
  };
  cleaners: {
    successful: number;
    failed: number;
  };
}

const BulkLinkRecordsUtility = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<LinkingResult[]>([]);
  const [summary, setSummary] = useState<LinkingSummary | null>(null);
  const { toast } = useToast();

  const handleBulkLink = async () => {
    setIsProcessing(true);
    setResults([]);
    setSummary(null);

    try {
      console.log('Starting bulk linking process...');
      
      const { data, error } = await supabase.functions.invoke('link-existing-records', {
        body: {}
      });

      console.log('Bulk linking response:', { data, error });

      if (error) {
        throw new Error(error.message || 'Failed to link records');
      }

      if (data?.success) {
        setResults(data.results || []);
        setSummary(data.summary || null);
        
        toast({
          title: "Bulk Linking Complete",
          description: `Successfully linked ${data.summary?.successful || 0} records. ${data.summary?.failed || 0} failed.`,
        });
      } else {
        throw new Error(data?.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error in bulk linking:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to link records',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (result: LinkingResult) => {
    if (result.success) {
      return result.message === 'Already linked' ? (
        <Badge variant="secondary">Already Linked</Badge>
      ) : (
        <Badge variant="default">✅ Linked</Badge>
      );
    } else {
      return <Badge variant="destructive">❌ Failed</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk Link Existing Records
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            This utility will link all existing customers and cleaners to authentication accounts, 
            creating login credentials for users who don't have them yet. This process:
          </div>
          
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Creates auth accounts for customers and cleaners without login access</li>
            <li>Links existing auth users to their customer/cleaner records by email</li>
            <li>Creates proper profile and user_role entries for all users</li>
            <li>Ensures all data is properly connected across all tables</li>
          </ul>

          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700">
              New accounts will be created with temporary password: <code>TempPass123!</code>
            </span>
          </div>
        </div>

        <Button 
          onClick={handleBulkLink}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Linking Records...
            </>
          ) : (
            <>
              <UserCheck className="mr-2 h-4 w-4" />
              Start Bulk Linking Process
            </>
          )}
        </Button>

        {summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{summary.successful}</div>
                <div className="text-sm text-green-700">Successfully Linked</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="font-medium">Customers</div>
                <div className="text-sm text-muted-foreground">
                  ✅ {summary.customers.successful} | ❌ {summary.customers.failed}
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="font-medium">Cleaners</div>
                <div className="text-sm text-muted-foreground">
                  ✅ {summary.cleaners.successful} | ❌ {summary.cleaners.failed}
                </div>
              </div>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Processing Results:</h4>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {result.recordType === 'customer' ? '👤' : '🧹'} 
                        {result.recordType.charAt(0).toUpperCase() + result.recordType.slice(1)} #{result.recordId}
                      </span>
                      {getStatusBadge(result)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {result.message}
                      {result.userId && (
                        <span className="block text-xs">User ID: {result.userId}</span>
                      )}
                      {result.error && (
                        <span className="block text-xs text-red-600">Error: {result.error}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkLinkRecordsUtility;