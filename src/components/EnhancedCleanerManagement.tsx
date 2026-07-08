import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Edit2, 
  Save, 
  X, 
  UserPlus, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign,
  Percent,
  CheckCircle,
  User,
  Eye,
  EyeOff,
  Loader2,
  Sparkles
} from 'lucide-react';
import { CleanerAccountActions } from './admin/CleanerAccountActions';
import { CleanerCalendarStatus } from './admin/CleanerCalendarStatus';
import { useAllCleanerCalendarConnections } from '@/hooks/useCleanerGoogleCalendar';
import { useQueryClient } from '@tanstack/react-query';
import { useServiceTypes } from '@/hooks/useCompanySettings';
import { useAllCleanerServiceTypes, allCleanerServiceTypesQueryKey } from '@/hooks/useCleanerServiceTypes';
import {
  useCoverageAreaOptions,
  useAllCleanerCoverageAreas,
  allCleanerCoverageAreasQueryKey,
} from '@/hooks/useCoverageAreas';

interface AreaCoverageSelectorProps {
  selectedIds: string[];
  onToggle: (boroughId: string) => void;
}

const AreaCoverageSelector: React.FC<AreaCoverageSelectorProps> = ({ selectedIds, onToggle }) => {
  const { data: areaOptions = [] } = useCoverageAreaOptions();
  const [filter, setFilter] = useState('');

  const visibleOptions = filter.trim()
    ? areaOptions.filter((a) => a.label.toLowerCase().includes(filter.trim().toLowerCase()))
    : areaOptions;

  return (
    <div className="space-y-2">
      <Input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter areas, e.g. Camden, Essex..."
        className="h-8 max-w-xs text-sm"
      />
      <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto pr-1">
        {visibleOptions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No areas match "{filter}"</p>
        ) : (
          visibleOptions.map((area) => (
            <label key={area.boroughId} className="flex items-center gap-2 text-sm bg-white/60 border rounded-md px-2 py-1.5 cursor-pointer">
              <Checkbox
                checked={selectedIds.includes(area.boroughId)}
                onCheckedChange={() => onToggle(area.boroughId)}
              />
              {area.label}
            </label>
          ))
        )}
      </div>
    </div>
  );
};

interface CleanerData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: number;
  address: string;
  postcode: string;
  hourly_rate: number;
  presentage_rate: number;
  services: string;
  years: number;
  rating: number;
  reviews: number;
  cleans_number: number;
  DBS: string;
  DBS_date: string;
  has_account?: boolean;
  has_equipment?: boolean;
}

const EnhancedCleanerManagement = () => {
  const [cleaners, setCleaners] = useState<CleanerData[]>([]);
  const [filteredCleaners, setFilteredCleaners] = useState<CleanerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCleaner, setEditingCleaner] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<CleanerData>>({});
  const [editServiceTypeKeys, setEditServiceTypeKeys] = useState<string[]>([]);
  const [editAreaIds, setEditAreaIds] = useState<string[]>([]);
  
  // Add new cleaner state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCleanerData, setNewCleanerData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    postcode: '',
    hourly_rate: 20,
    presentage_rate: 70,
    services: '',
    years: 0,
    DBS: 'No',
    DBS_date: '',
    has_equipment: true
  });
  const [newServiceTypeKeys, setNewServiceTypeKeys] = useState<string[]>([]);
  const [newAreaIds, setNewAreaIds] = useState<string[]>([]);
  const [addingCleaner, setAddingCleaner] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: serviceTypes = [] } = useServiceTypes();
  const { data: cleanerServiceTypeMap = new Map<number, string[]>() } = useAllCleanerServiceTypes();
  const { data: areaOptions = [] } = useCoverageAreaOptions();
  const { data: cleanerCoverageAreaMap = new Map<number, string[]>() } = useAllCleanerCoverageAreas();
  const { data: cleanerCalendarConnectionMap = new Map() } = useAllCleanerCalendarConnections();

  const toggleServiceTypeKey = (keys: string[], setKeys: (keys: string[]) => void, key: string) => {
    setKeys(keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]);
  };

  const saveCleanerServiceTypes = async (cleanerId: number, serviceTypeKeys: string[]) => {
    const { error: deleteError } = await supabase
      .from('cleaner_service_types')
      .delete()
      .eq('cleaner_id', cleanerId);
    if (deleteError) throw deleteError;

    if (serviceTypeKeys.length > 0) {
      const { error: insertError } = await supabase
        .from('cleaner_service_types')
        .insert(serviceTypeKeys.map((key) => ({ cleaner_id: cleanerId, service_type_key: key })));
      if (insertError) throw insertError;
    }

    queryClient.invalidateQueries({ queryKey: allCleanerServiceTypesQueryKey });
  };

  const saveCleanerCoverageAreas = async (cleanerId: number, boroughIds: string[]) => {
    const { error: deleteError } = await supabase
      .from('cleaner_coverage_areas')
      .delete()
      .eq('cleaner_id', cleanerId);
    if (deleteError) throw deleteError;

    if (boroughIds.length > 0) {
      const { error: insertError } = await supabase
        .from('cleaner_coverage_areas')
        .insert(boroughIds.map((boroughId) => ({ cleaner_id: cleanerId, borough_id: boroughId })));
      if (insertError) throw insertError;
    }

    queryClient.invalidateQueries({ queryKey: allCleanerCoverageAreasQueryKey });
  };

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

  const startEditing = (cleaner: CleanerData) => {
    setEditingCleaner(cleaner.id);
    setEditData({
      first_name: cleaner.first_name,
      last_name: cleaner.last_name,
      email: cleaner.email,
      phone: cleaner.phone,
      address: cleaner.address,
      postcode: cleaner.postcode,
      hourly_rate: cleaner.hourly_rate,
      presentage_rate: cleaner.presentage_rate,
      services: cleaner.services,
      years: cleaner.years,
      DBS: cleaner.DBS,
      DBS_date: cleaner.DBS_date,
      has_equipment: cleaner.has_equipment ?? true
    });
    setEditServiceTypeKeys(cleanerServiceTypeMap.get(cleaner.id) || []);
    setEditAreaIds(cleanerCoverageAreaMap.get(cleaner.id) || []);
  };

  const updateCleaner = async (cleanerId: number) => {
    try {
      const { error } = await supabase
        .from('cleaners')
        .update(editData)
        .eq('id', cleanerId);

      if (error) throw error;

      await saveCleanerServiceTypes(cleanerId, editServiceTypeKeys);
      await saveCleanerCoverageAreas(cleanerId, editAreaIds);

      toast({
        title: 'Success',
        description: 'Cleaner updated successfully!',
      });

      setEditingCleaner(null);
      setEditData({});
      setEditServiceTypeKeys([]);
      setEditAreaIds([]);
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

  const addCleaner = async () => {
    try {
      setAddingCleaner(true);
      
      // First create the cleaner record
      const { data: cleanerData, error: cleanerError } = await supabase
        .from('cleaners')
        .insert({
          first_name: newCleanerData.first_name,
          last_name: newCleanerData.last_name,
          email: newCleanerData.email,
          phone: Number(newCleanerData.phone),
          address: newCleanerData.address,
          postcode: newCleanerData.postcode,
          hourly_rate: newCleanerData.hourly_rate,
          presentage_rate: newCleanerData.presentage_rate,
          services: newCleanerData.services,
          years: newCleanerData.years,
          DBS: newCleanerData.DBS,
          DBS_date: newCleanerData.DBS_date || null,
          has_equipment: newCleanerData.has_equipment,
          full_name: `${newCleanerData.first_name} ${newCleanerData.last_name}`.trim(),
          rating: 0,
          reviews: 0,
          cleans_number: 0
        })
        .select()
        .single();

      if (cleanerError) throw cleanerError;

      if (newServiceTypeKeys.length > 0) {
        await saveCleanerServiceTypes(cleanerData.id, newServiceTypeKeys);
      }
      if (newAreaIds.length > 0) {
        await saveCleanerCoverageAreas(cleanerData.id, newAreaIds);
      }

      // Create user account if password provided
      if (newCleanerData.password) {
        try {
          const { error: userError } = await supabase.functions.invoke('create-user', {
            body: {
              email: newCleanerData.email,
              password: newCleanerData.password,
              firstName: newCleanerData.first_name,
              lastName: newCleanerData.last_name,
              role: 'user'
            }
          });

          if (userError) {
            console.error('Error creating user account:', userError);
            toast({
              title: 'Partial Success',
              description: 'Cleaner created but failed to create user account. You can create it later.',
              variant: 'default',
            });
          }
        } catch (accountError) {
          console.error('Error creating account:', accountError);
        }
      }

      toast({
        title: 'Success',
        description: 'Cleaner created successfully!',
      });

      setShowAddDialog(false);
      setNewCleanerData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        postcode: '',
        hourly_rate: 20,
        presentage_rate: 70,
        services: '',
        years: 0,
        DBS: 'No',
        DBS_date: '',
        has_equipment: true
      });
      setNewServiceTypeKeys([]);
      setNewAreaIds([]);
      fetchCleaners();
    } catch (error: any) {
      console.error('Error creating cleaner:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create cleaner',
        variant: 'destructive',
      });
    } finally {
      setAddingCleaner(false);
    }
  };

  useEffect(() => {
    fetchCleaners();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Cleaners ({filteredCleaners.length})
          </span>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Cleaner
          </Button>
        </CardTitle>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search cleaners by name, email, phone, or ID..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading cleaners...</p>
          </div>
        ) : filteredCleaners.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No cleaners found matching your search.' : 'No cleaners found.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCleaners.map((cleaner) => (
              <div key={cleaner.id} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all">
                {editingCleaner === cleaner.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">First Name</Label>
                        <Input
                          value={editData.first_name || ''}
                          onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Last Name</Label>
                        <Input
                          value={editData.last_name || ''}
                          onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                        <Input
                          type="email"
                          value={editData.email || ''}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                        <Input
                          type="number"
                          value={editData.phone || ''}
                          onChange={(e) => setEditData({ ...editData, phone: Number(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Hourly Rate (£)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editData.hourly_rate || ''}
                          onChange={(e) => setEditData({ ...editData, hourly_rate: Number(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Percentage Rate (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editData.presentage_rate || ''}
                          onChange={(e) => setEditData({ ...editData, presentage_rate: Number(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs font-medium text-muted-foreground">Address</Label>
                        <Input
                          value={editData.address || ''}
                          onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Postcode</Label>
                        <Input
                          value={editData.postcode || ''}
                          onChange={(e) => setEditData({ ...editData, postcode: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <Label className="text-xs font-medium text-muted-foreground">Notes (optional)</Label>
                        <Input
                          value={editData.services || ''}
                          onChange={(e) => setEditData({ ...editData, services: e.target.value })}
                          placeholder="Free-text notes, e.g. own equipment, prefers weekends..."
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                        Services offered
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        {editServiceTypeKeys.length === 0
                          ? 'No services selected — this cleaner is treated as offering every service.'
                          : 'This cleaner will only be flagged as a match for the selected services below.'}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {serviceTypes.map((st) => (
                          <label key={st.key} className="flex items-center gap-2 text-sm bg-white/60 border rounded-md px-2 py-1.5 cursor-pointer">
                            <Checkbox
                              checked={editServiceTypeKeys.includes(st.key)}
                              onCheckedChange={() => toggleServiceTypeKey(editServiceTypeKeys, setEditServiceTypeKeys, st.key)}
                            />
                            {st.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                        Areas covered
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        {editAreaIds.length === 0
                          ? 'No areas selected — this cleaner is treated as covering every area.'
                          : 'This cleaner will only be flagged as a match for bookings in the selected areas below.'}
                      </p>
                      <AreaCoverageSelector
                        selectedIds={editAreaIds}
                        onToggle={(boroughId) => toggleServiceTypeKey(editAreaIds, setEditAreaIds, boroughId)}
                      />
                    </div>
                    <div className="flex items-center justify-between bg-white/60 border rounded-md px-3 py-2">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Has own equipment</Label>
                        <p className="text-xs text-muted-foreground">
                          Toggle off if this cleaner does not bring their own vacuum/mop/supplies.
                        </p>
                      </div>
                      <Switch
                        checked={editData.has_equipment ?? true}
                        onCheckedChange={(checked) => setEditData({ ...editData, has_equipment: checked })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => updateCleaner(cleaner.id)}
                        size="sm"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        onClick={() => { setEditingCleaner(null); setEditServiceTypeKeys([]); setEditAreaIds([]); }}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg text-primary">
                          {cleaner.first_name} {cleaner.last_name}
                        </h3>
                        {cleaner.has_account && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Has Account
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          ID: {cleaner.id}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="break-all">{cleaner.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{cleaner.phone || 'No phone'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{cleaner.address ? `${cleaner.address}, ${cleaner.postcode}` : 'No address'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-primary font-medium">
                          <DollarSign className="h-4 w-4" />
                          <span>£{cleaner.hourly_rate || 0}/hour</span>
                        </div>
                        <div className="flex items-center gap-2 text-primary font-medium">
                          <Percent className="h-4 w-4" />
                          <span>{cleaner.presentage_rate || 0}% rate</span>
                        </div>
                        <div className="text-muted-foreground">
                          <span>Experience: {cleaner.years || 0} years</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 flex-wrap text-sm">
                        <span className="text-muted-foreground font-medium">Services:</span>
                        {(cleanerServiceTypeMap.get(cleaner.id) || []).length === 0 ? (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Sparkles className="h-3 w-3" />
                            All services
                          </Badge>
                        ) : (
                          (cleanerServiceTypeMap.get(cleaner.id) || []).map((key) => {
                            const st = serviceTypes.find((s) => s.key === key);
                            return (
                              <Badge key={key} variant="outline" className="text-xs">
                                {st?.label || key}
                              </Badge>
                            );
                          })
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap text-sm">
                        <span className="text-muted-foreground font-medium">Areas:</span>
                        {(() => {
                          const boroughIds = cleanerCoverageAreaMap.get(cleaner.id) || [];
                          if (boroughIds.length === 0) {
                            return (
                              <Badge variant="outline" className="text-xs gap-1">
                                <MapPin className="h-3 w-3" />
                                All areas
                              </Badge>
                            );
                          }
                          const labels = boroughIds.map(
                            (id) => areaOptions.find((a) => a.boroughId === id)?.label || 'Unknown'
                          );
                          const shown = labels.slice(0, 3);
                          const remaining = labels.length - shown.length;
                          return (
                            <>
                              {shown.map((label, i) => (
                                <Badge key={boroughIds[i]} variant="outline" className="text-xs">
                                  {label}
                                </Badge>
                              ))}
                              {remaining > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  +{remaining} more
                                </Badge>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap text-sm">
                        <span className="text-muted-foreground font-medium">Equipment:</span>
                        {cleaner.has_equipment === false ? (
                          <Badge variant="outline" className="text-xs text-amber-700 border-amber-300 bg-amber-50">
                            No own equipment
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Brings own equipment
                          </Badge>
                        )}
                      </div>

                      <CleanerCalendarStatus connection={cleanerCalendarConnectionMap.get(cleaner.id)} />

                      {cleaner.services && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Notes:</strong> {cleaner.services}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <CleanerAccountActions 
                        cleaner={cleaner}
                        onAccountCreated={fetchCleaners}
                      />
                      <Button
                        onClick={() => startEditing(cleaner)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => deleteCleaner(cleaner.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Cleaner Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Cleaner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={newCleanerData.first_name}
                  onChange={(e) => setNewCleanerData({ ...newCleanerData, first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={newCleanerData.last_name}
                  onChange={(e) => setNewCleanerData({ ...newCleanerData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCleanerData.email}
                  onChange={(e) => setNewCleanerData({ ...newCleanerData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newCleanerData.phone}
                  onChange={(e) => setNewCleanerData({ ...newCleanerData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password (Optional - for creating user account)</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={newCleanerData.password}
                  onChange={(e) => setNewCleanerData({ ...newCleanerData, password: e.target.value })}
                  placeholder="Leave empty to skip account creation"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newCleanerData.address}
                  onChange={(e) => setNewCleanerData({ ...newCleanerData, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  value={newCleanerData.postcode}
                  onChange={(e) => setNewCleanerData({ ...newCleanerData, postcode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate (£) *</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={newCleanerData.hourly_rate}
                  onChange={(e) => setNewCleanerData({ ...newCleanerData, hourly_rate: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="percentageRate">Percentage Rate (%) *</Label>
                <Input
                  id="percentageRate"
                  type="number"
                  min="0"
                  max="100"
                  value={newCleanerData.presentage_rate}
                  onChange={(e) => setNewCleanerData({ ...newCleanerData, presentage_rate: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Services offered</Label>
              <p className="text-xs text-gray-500 mb-2">
                Leave all unchecked to treat this cleaner as offering every service (default).
              </p>
              <div className="flex flex-wrap gap-3">
                {serviceTypes.map((st) => (
                  <label key={st.key} className="flex items-center gap-2 text-sm border rounded-md px-2 py-1.5 cursor-pointer">
                    <Checkbox
                      checked={newServiceTypeKeys.includes(st.key)}
                      onCheckedChange={() => toggleServiceTypeKey(newServiceTypeKeys, setNewServiceTypeKeys, st.key)}
                    />
                    {st.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Areas covered</Label>
              <p className="text-xs text-gray-500 mb-2">
                Leave all unchecked to treat this cleaner as covering every area (default).
              </p>
              <AreaCoverageSelector
                selectedIds={newAreaIds}
                onToggle={(boroughId) => toggleServiceTypeKey(newAreaIds, setNewAreaIds, boroughId)}
              />
            </div>

            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <div>
                <Label className="mb-1 block">Has own equipment</Label>
                <p className="text-xs text-gray-500">
                  On by default — toggle off if this cleaner does not bring their own vacuum/mop/supplies.
                </p>
              </div>
              <Switch
                checked={newCleanerData.has_equipment}
                onCheckedChange={(checked) => setNewCleanerData({ ...newCleanerData, has_equipment: checked })}
              />
            </div>

            <div>
              <Label htmlFor="services">Notes (optional)</Label>
              <Input
                id="services"
                value={newCleanerData.services}
                onChange={(e) => setNewCleanerData({ ...newCleanerData, services: e.target.value })}
                placeholder="Free-text notes, e.g. own equipment, prefers weekends..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="years">Years Experience</Label>
                <Input
                  id="years"
                  type="number"
                  min="0"
                  value={newCleanerData.years}
                  onChange={(e) => setNewCleanerData({ ...newCleanerData, years: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="dbs">DBS Status</Label>
                <Select
                  value={newCleanerData.DBS}
                  onValueChange={(value) => setNewCleanerData({ ...newCleanerData, DBS: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dbsDate">DBS Date</Label>
                <Input
                  id="dbsDate"
                  type="date"
                  value={newCleanerData.DBS_date}
                  onChange={(e) => setNewCleanerData({ ...newCleanerData, DBS_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addCleaner} disabled={addingCleaner}>
                {addingCleaner ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Cleaner'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default EnhancedCleanerManagement;