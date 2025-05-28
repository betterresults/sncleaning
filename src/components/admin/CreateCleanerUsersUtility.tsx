
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface ProcessResult {
  cleaner: Cleaner;
  status: 'success' | 'error' | 'exists';
  message: string;
}

const CreateCleanerUsersUtility = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const { toast } = useToast();

  const fetchCleaners = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name, email')
        .not('email', 'is', null);

      if (error) throw error;
      
      setCleaners(data || []);
      return data || [];
    } catch (error: any) {
      console.error('Error fetching cleaners:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch cleaners from database',
        variant: 'destructive',
      });
      return [];
    }
  };

  const createUserForCleaner = async (cleaner: Cleaner): Promise<ProcessResult> => {
    try {
      // Check if user already exists by checking profiles table
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', cleaner.email)
        .single();

      if (existingProfile && !profileError) {
        return {
          cleaner,
          status: 'exists',
          message: 'User already exists'
        };
      }

      // Create user via edge function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: cleaner.email,
          password: '123456',
          firstName: cleaner.first_name || '',
          lastName: cleaner.last_name || '',
          role: 'user' // This will make them a cleaner
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create user');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create user');
      }

      return {
        cleaner,
        status: 'success',
        message: 'User created successfully'
      };

    } catch (error: any) {
      console.error('Error creating user for cleaner:', cleaner.email, error);
      return {
        cleaner,
        status: 'error',
        message: error.message || 'Unknown error occurred'
      };
    }
  };

  const processAllCleaners = async () => {
    setLoading(true);
    setProgress(0);
    setResults([]);

    try {
      const cleanersToProcess = await fetchCleaners();
      
      if (cleanersToProcess.length === 0) {
        toast({
          title: 'Info',
          description: 'No cleaners found to process',
        });
        return;
      }

      const processResults: ProcessResult[] = [];

      for (let i = 0; i < cleanersToProcess.length; i++) {
        const cleaner = cleanersToProcess[i];
        const result = await createUserForCleaner(cleaner);
        processResults.push(result);
        
        // Update progress
        setProgress(((i + 1) / cleanersToProcess.length) * 100);
        setResults([...processResults]);

        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const successCount = processResults.filter(r => r.status === 'success').length;
      const existsCount = processResults.filter(r => r.status === 'exists').length;
      const errorCount = processResults.filter(r => r.status === 'error').length;

      toast({
        title: 'Process Complete',
        description: `Created: ${successCount}, Already exists: ${existsCount}, Errors: ${errorCount}`,
      });

    } catch (error: any) {
      console.error('Error processing cleaners:', error);
      toast({
        title: 'Error',
        description: 'Failed to process cleaners',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ProcessResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'exists':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: ProcessResult['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'exists':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create User Accounts for Cleaners
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This utility will create user accounts for all cleaners with email addresses. 
            Default password will be set to "123456". Users already existing will be skipped.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={processAllCleaners} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Processing...' : 'Create User Accounts for All Cleaners'}
        </Button>

        {loading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600 text-center">
              Processing... {Math.round(progress)}% complete
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Results:</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="font-medium">
                      {result.cleaner.first_name} {result.cleaner.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{result.cleaner.email}</div>
                  </div>
                  <div className={`text-sm ${getStatusColor(result.status)}`}>
                    {result.message}
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

export default CreateCleanerUsersUtility;
