import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2, Users, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CleanerAccountActions } from '@/components/admin/CleanerAccountActions';

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  full_name?: string;
  phone?: number;
}

interface ProcessResult {
  cleaner: Cleaner;
  status: 'success' | 'error' | 'exists';
  message: string;
}

interface CreateCleanerUsersUtilityProps {
  readOnly?: boolean;
}

const CreateCleanerUsersUtility = ({ readOnly = false }: CreateCleanerUsersUtilityProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingCleaners, setLoadingCleaners] = useState(true);
  const [results, setResults] = useState<ProcessResult[]>([]);

  const fetchCleaners = async () => {
    try {
      setLoadingCleaners(true);
      const { data, error } = await supabase
        .from('cleaners')
        .select('*')
        .order('id', { ascending: false });

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
    } finally {
      setLoadingCleaners(false);
    }
  };

  useEffect(() => {
    fetchCleaners();
  }, []);

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
      const cleanersToProcess = cleaners.filter(c => c.email);
      
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

  const filteredCleaners = cleaners.filter(cleaner =>
    cleaner.email && (
      cleaner.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cleaner.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cleaner.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cleaner.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Cleaner Account Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Bar */}
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cleaners by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Individual Cleaners List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Individual Cleaner Management</h3>
              <Badge variant="outline">{filteredCleaners.length} cleaners</Badge>
            </div>

            {loadingCleaners ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading cleaners...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredCleaners.map((cleaner) => (
                  <div key={cleaner.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {cleaner.full_name || `${cleaner.first_name} ${cleaner.last_name}`}
                      </h4>
                      <p className="text-sm text-muted-foreground">{cleaner.email}</p>
                      {cleaner.phone && (
                        <p className="text-xs text-muted-foreground">{cleaner.phone}</p>
                      )}
                    </div>
                    <CleanerAccountActions 
                      cleaner={cleaner}
                      onAccountCreated={fetchCleaners}
                      readOnly={readOnly}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {!readOnly && (
            <>
              <hr className="my-6" />

              {/* Bulk Operations */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Bulk Operations</h3>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    This utility will create user accounts for all cleaners with email addresses. 
                    Cleaners will receive login credentials to access their dashboard.
                  </p>
                </div>

                <Button 
                  onClick={processAllCleaners} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Processing...' : 'Create User Accounts for All Cleaners'}
                </Button>

                {loading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Creating accounts...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}

                {results.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Bulk Operation Results:</h4>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {results.map((result, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <div className="flex-1">
                            <div className="font-medium">
                              {result.cleaner.first_name} {result.cleaner.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{result.cleaner.email}</div>
                          </div>
                          <Badge variant={result.status === 'success' ? 'default' : result.status === 'exists' ? 'secondary' : 'destructive'}>
                            {result.message}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCleanerUsersUtility;