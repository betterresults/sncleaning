import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Search, CheckCircle } from 'lucide-react';
import { CleanerAccountActions } from '@/components/admin/CleanerAccountActions';

interface CleanerData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: number;
  address: string;
  postcode: string;
  full_name: string;
  hourly_rate: number;
  presentage_rate: number;
  DBS: string;
  DBS_date: string;
  services: string;
  years: number;
  rating: number;
  reviews: number;
  cleans_number: number;
  has_account?: boolean;
}

interface CleanersSectionProps {
  hideCreateButton?: boolean;
  showCreateForm?: boolean;
  onCreateSuccess?: () => void;
}

const CleanersSection = ({ hideCreateButton, showCreateForm, onCreateSuccess }: CleanersSectionProps) => {
  const [cleaners, setCleaners] = useState<CleanerData[]>([]);
  const [filteredCleaners, setFilteredCleaners] = useState<CleanerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingCleaner, setEditingCleaner] = useState<number | null>(null);
  const [editCleanerData, setEditCleanerData] = useState<Partial<CleanerData>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [newCleaner, setNewCleaner] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    postcode: '',
    hourly_rate: 0,
    presentage_rate: 0,
    services: '',
    years: 0
  });
  const { toast } = useToast();

  const fetchCleaners = async () => {
    try {
      setLoading(true);
      
      const { data: cleaners, error } = await supabase
        .from('cleaners')
        .select('*')
        .order('id', { ascending: false });
      
      if (error) throw error;

      // Check which cleaners have accounts
      const processedCleaners = await Promise.all(
        cleaners?.map(async (cleaner) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('cleaner_id', cleaner.id)
            .single();

          return {
            ...cleaner,
            has_account: !!profile
          };
        }) || []
      );

      setCleaners(processedCleaners);
      setFilteredCleaners(processedCleaners);
    } catch (error: any) {
      console.error('Error fetching cleaners:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch cleaners',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createCleaner = async () => {
    try {
      setCreating(true);
      
      const { data, error } = await supabase
        .from('cleaners')
        .insert({
          first_name: newCleaner.first_name,
          last_name: newCleaner.last_name,
          email: newCleaner.email,
          phone: Number(newCleaner.phone),
          address: newCleaner.address,
          postcode: newCleaner.postcode,
          hourly_rate: newCleaner.hourly_rate,
          presentage_rate: newCleaner.presentage_rate,
          services: newCleaner.services,
          years: newCleaner.years
        })
        .select();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Cleaner created successfully!',
      });

      setNewCleaner({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        postcode: '',
        hourly_rate: 0,
        presentage_rate: 0,
        services: '',
        years: 0
      });
      fetchCleaners();
    } catch (error: any) {
      console.error('Error creating cleaner:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create cleaner',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const updateCleaner = async (cleanerId: number) => {
    try {
      const { error } = await supabase
        .from('cleaners')
        .update(editCleanerData)
        .eq('id', cleanerId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Cleaner updated successfully!',
      });

      setEditingCleaner(null);
      setEditCleanerData({});
      fetchCleaners();
    } catch (error: any) {
      console.error('Error updating cleaner:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update cleaner',
        variant: 'destructive',
      });
    }
  };

  const deleteCleaner = async (cleanerId: number) => {
    if (!confirm('Are you sure you want to delete this cleaner?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cleaners')
        .delete()
        .eq('id', cleanerId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Cleaner deleted successfully!',
      });

      fetchCleaners();
    } catch (error: any) {
      console.error('Error deleting cleaner:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete cleaner',
        variant: 'destructive',
      });
    }
  };

  const startEditingCleaner = (cleaner: CleanerData) => {
    setEditingCleaner(cleaner.id);
    setEditCleanerData({
      first_name: cleaner.first_name,
      last_name: cleaner.last_name,
      email: cleaner.email,
      phone: cleaner.phone,
      address: cleaner.address,
      postcode: cleaner.postcode,
      hourly_rate: cleaner.hourly_rate,
      presentage_rate: cleaner.presentage_rate,
      services: cleaner.services,
      years: cleaner.years
    });
  };

  const cancelEditing = () => {
    setEditingCleaner(null);
    setEditCleanerData({});
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === '') {
      setFilteredCleaners(cleaners);
    } else {
      const filtered = cleaners.filter(cleaner => 
        cleaner.first_name?.toLowerCase().includes(term.toLowerCase()) ||
        cleaner.last_name?.toLowerCase().includes(term.toLowerCase()) ||
        cleaner.email?.toLowerCase().includes(term.toLowerCase()) ||
        cleaner.phone?.toString().includes(term) ||
        cleaner.id.toString().includes(term)
      );
      setFilteredCleaners(filtered);
    }
  };

  useEffect(() => {
    fetchCleaners();
  }, []);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [cleaners]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h3 className="text-base sm:text-lg font-semibold">Cleaners ({filteredCleaners.length})</h3>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search cleaners by name, email, phone, or ID..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cleaners List */}
      <div>
        {loading ? (
          <div className="text-center py-8">Loading cleaners...</div>
        ) : filteredCleaners.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No cleaners found matching your search.' : 'No cleaners found.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCleaners.map((cleaner) => (
              <div key={cleaner.id} className="p-3 sm:p-4 border rounded-lg">
                {editingCleaner === cleaner.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <Input
                        placeholder="First Name"
                        value={editCleanerData.first_name || ''}
                        onChange={(e) => setEditCleanerData({ ...editCleanerData, first_name: e.target.value })}
                        className="text-sm"
                      />
                      <Input
                        placeholder="Last Name"
                        value={editCleanerData.last_name || ''}
                        onChange={(e) => setEditCleanerData({ ...editCleanerData, last_name: e.target.value })}
                        className="text-sm"
                      />
                      <Input
                        placeholder="Email"
                        value={editCleanerData.email || ''}
                        onChange={(e) => setEditCleanerData({ ...editCleanerData, email: e.target.value })}
                        className="text-sm"
                      />
                      <Input
                        placeholder="Phone"
                        type="number"
                        value={editCleanerData.phone || ''}
                        onChange={(e) => setEditCleanerData({ ...editCleanerData, phone: Number(e.target.value) })}
                        className="text-sm"
                      />
                      <Input
                        placeholder="Address"
                        value={editCleanerData.address || ''}
                        onChange={(e) => setEditCleanerData({ ...editCleanerData, address: e.target.value })}
                        className="text-sm"
                      />
                      <Input
                        placeholder="Postcode"
                        value={editCleanerData.postcode || ''}
                        onChange={(e) => setEditCleanerData({ ...editCleanerData, postcode: e.target.value })}
                        className="text-sm"
                      />
                      <Input
                        placeholder="Hourly Rate"
                        type="number"
                        value={editCleanerData.hourly_rate || ''}
                        onChange={(e) => setEditCleanerData({ ...editCleanerData, hourly_rate: Number(e.target.value) })}
                        className="text-sm"
                      />
                      <Input
                        placeholder="Percentage Rate"
                        type="number"
                        value={editCleanerData.presentage_rate || ''}
                        onChange={(e) => setEditCleanerData({ ...editCleanerData, presentage_rate: Number(e.target.value) })}
                        className="text-sm"
                      />
                      <Input
                        placeholder="Services"
                        value={editCleanerData.services || ''}
                        onChange={(e) => setEditCleanerData({ ...editCleanerData, services: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        onClick={() => updateCleaner(cleaner.id)}
                        size="sm"
                        className="text-sm w-full sm:w-auto"
                      >
                        Save
                      </Button>
                      <Button 
                        onClick={cancelEditing}
                        variant="outline"
                        size="sm"
                        className="text-sm w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium text-sm sm:text-base mb-1">
                        <span>{cleaner.first_name} {cleaner.last_name}</span>
                        {cleaner.has_account && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Has Account
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 break-all">{cleaner.email}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{cleaner.phone}</div>
                      <div className="text-xs text-gray-400">
                        {cleaner.address}, {cleaner.postcode}
                      </div>
                      <div className="text-xs text-gray-400">
                        ID: {cleaner.id} • Rate: £{cleaner.hourly_rate}/hr • {cleaner.presentage_rate}%
                      </div>
                      <div className="text-xs text-gray-400">
                        Years: {cleaner.years} • Cleans: {cleaner.cleans_number || 0} • Rating: {cleaner.rating || 'N/A'}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2 lg:items-end">
                      <CleanerAccountActions 
                        cleaner={cleaner}
                        onAccountCreated={fetchCleaners}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => startEditingCleaner(cleaner)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-xs flex-1 sm:flex-none"
                        >
                          <Edit className="h-3 w-3" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                          onClick={() => deleteCleaner(cleaner.id)}
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-1 text-xs flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CleanersSection;