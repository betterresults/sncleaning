import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import { UserCheck } from 'lucide-react';

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

const AdminCleanerSelector = () => {
  const { toast } = useToast();
  const { selectedCleanerId, setSelectedCleanerId } = useAdminCleaner();
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCleaners = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name, email')
        .order('first_name');

      if (error) throw error;
      setCleaners(data || []);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cleaners',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCleaners();
  }, []);

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <p className="text-muted-foreground">Loading cleaners...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-900">Admin View - Select Cleaner:</span>
          </div>
          <Select 
            value={selectedCleanerId?.toString() || ""} 
            onValueChange={(value) => setSelectedCleanerId(value ? parseInt(value) : null)}
          >
            <SelectTrigger className="w-80">
              <SelectValue placeholder="Choose a cleaner to view as..." />
            </SelectTrigger>
            <SelectContent>
              {cleaners.map((cleaner) => (
                <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    {cleaner.first_name} {cleaner.last_name} ({cleaner.email})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminCleanerSelector;