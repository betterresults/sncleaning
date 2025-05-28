
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CreateCleanerDialog from './CreateCleanerDialog';

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: number;
}

interface CleanerSelectorProps {
  onCleanerSelect: (cleaner: Cleaner | null) => void;
}

const CleanerSelector = ({ onCleanerSelect }: CleanerSelectorProps) => {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [filteredCleaners, setFilteredCleaners] = useState<Cleaner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCleanerId, setSelectedCleanerId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchCleaners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cleaners')
        .select('*')
        .order('first_name');

      if (error) {
        console.error('Error fetching cleaners:', error);
        return;
      }

      setCleaners(data || []);
      setFilteredCleaners(data || []);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCleaners();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = cleaners.filter(cleaner => {
        const fullName = cleaner.full_name || `${cleaner.first_name || ''} ${cleaner.last_name || ''}`.trim();
        return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (cleaner.email && cleaner.email.toLowerCase().includes(searchTerm.toLowerCase()));
      });
      setFilteredCleaners(filtered);
    } else {
      setFilteredCleaners(cleaners);
    }
  }, [searchTerm, cleaners]);

  const handleCleanerSelect = (cleanerId: string) => {
    setSelectedCleanerId(cleanerId);
    
    if (cleanerId === 'new') {
      onCleanerSelect(null);
      return;
    }

    const cleaner = cleaners.find(c => c.id.toString() === cleanerId);
    if (cleaner) {
      onCleanerSelect(cleaner);
    }
  };

  const handleCleanerCreated = (newCleaner: Cleaner) => {
    setCleaners(prev => [...prev, newCleaner]);
    setSelectedCleanerId(newCleaner.id.toString());
    onCleanerSelect(newCleaner);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="cleanerSearch">Search Existing Cleaner</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            id="cleanerSearch"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cleanerSelect">Select Cleaner</Label>
        <div className="flex gap-2">
          <Select value={selectedCleanerId} onValueChange={handleCleanerSelect}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Choose an existing cleaner or create new" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">+ Create New Cleaner</SelectItem>
              {loading ? (
                <SelectItem value="loading" disabled>Loading cleaners...</SelectItem>
              ) : filteredCleaners.length === 0 ? (
                <SelectItem value="no-cleaners" disabled>No cleaners found</SelectItem>
              ) : (
                filteredCleaners.map((cleaner) => {
                  const displayName = cleaner.full_name || `${cleaner.first_name || ''} ${cleaner.last_name || ''}`.trim();
                  return (
                    <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                      {displayName} {cleaner.email && `- ${cleaner.email}`}
                    </SelectItem>
                  );
                })
              )}
            </SelectContent>
          </Select>
          
          <CreateCleanerDialog onCleanerCreated={handleCleanerCreated}>
            <Button type="button" variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </CreateCleanerDialog>
        </div>
      </div>
    </div>
  );
};

export default CleanerSelector;
