import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, MapPin } from 'lucide-react';

interface Region {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

interface Borough {
  id: string;
  region_id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

interface PostcodePrefix {
  id: string;
  borough_id: string;
  prefix: string;
  domestic_cleaning: boolean;
  airbnb_cleaning: boolean;
  end_of_tenancy: boolean;
  is_active: boolean;
}

const CoverageManagement = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [boroughs, setBoroughs] = useState<Borough[]>([]);
  const [postcodes, setPostcodes] = useState<PostcodePrefix[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [dialogType, setDialogType] = useState<'region' | 'borough' | 'postcode' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formRegionId, setFormRegionId] = useState('');
  const [formBoroughId, setFormBoroughId] = useState('');
  const [formServices, setFormServices] = useState({
    domestic_cleaning: true,
    airbnb_cleaning: true,
    end_of_tenancy: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [regionsRes, boroughsRes, postcodesRes] = await Promise.all([
        supabase.from('coverage_regions').select('*').order('name'),
        supabase.from('coverage_boroughs').select('*').order('name'),
        supabase.from('postcode_prefixes').select('*').order('prefix'),
      ]);

      if (regionsRes.error) throw regionsRes.error;
      if (boroughsRes.error) throw boroughsRes.error;
      if (postcodesRes.error) throw postcodesRes.error;

      setRegions(regionsRes.data || []);
      setBoroughs(boroughsRes.data || []);
      setPostcodes(postcodesRes.data || []);
    } catch (error) {
      console.error('Error fetching coverage data:', error);
      toast.error('Failed to load coverage data');
    } finally {
      setLoading(false);
    }
  };

  const toggleRegion = (regionId: string) => {
    const newExpanded = new Set(expandedRegions);
    if (newExpanded.has(regionId)) {
      newExpanded.delete(regionId);
    } else {
      newExpanded.add(regionId);
    }
    setExpandedRegions(newExpanded);
  };

  const getBoroughsForRegion = (regionId: string) => boroughs.filter(b => b.region_id === regionId);
  const getPostcodesForBorough = (boroughId: string) => postcodes.filter(p => p.borough_id === boroughId);

  // Open dialogs
  const openAddRegion = () => {
    setDialogType('region');
    setEditingItem(null);
    setFormName('');
  };

  const openEditRegion = (region: Region) => {
    setDialogType('region');
    setEditingItem(region);
    setFormName(region.name);
  };

  const openAddBorough = (regionId?: string) => {
    setDialogType('borough');
    setEditingItem(null);
    setFormName('');
    setFormRegionId(regionId || '');
  };

  const openEditBorough = (borough: Borough) => {
    setDialogType('borough');
    setEditingItem(borough);
    setFormName(borough.name);
    setFormRegionId(borough.region_id);
  };

  const openAddPostcode = (boroughId?: string) => {
    setDialogType('postcode');
    setEditingItem(null);
    setFormName('');
    setFormBoroughId(boroughId || '');
    setFormServices({ domestic_cleaning: true, airbnb_cleaning: true, end_of_tenancy: true });
  };

  const openEditPostcode = (postcode: PostcodePrefix) => {
    setDialogType('postcode');
    setEditingItem(postcode);
    setFormName(postcode.prefix);
    setFormBoroughId(postcode.borough_id);
    setFormServices({
      domestic_cleaning: postcode.domestic_cleaning,
      airbnb_cleaning: postcode.airbnb_cleaning,
      end_of_tenancy: postcode.end_of_tenancy,
    });
  };

  const closeDialog = () => {
    setDialogType(null);
    setEditingItem(null);
    setFormName('');
    setFormRegionId('');
    setFormBoroughId('');
  };

  // Save functions
  const saveRegion = async () => {
    if (!formName.trim()) return;
    try {
      if (editingItem) {
        const { error } = await supabase.from('coverage_regions').update({ name: formName }).eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Region updated');
      } else {
        const { error } = await supabase.from('coverage_regions').insert({ name: formName });
        if (error) throw error;
        toast.success('Region added');
      }
      closeDialog();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save region');
    }
  };

  const saveBorough = async () => {
    if (!formName.trim() || !formRegionId) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      if (editingItem) {
        const { error } = await supabase.from('coverage_boroughs').update({ name: formName, region_id: formRegionId }).eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Borough updated');
      } else {
        const { error } = await supabase.from('coverage_boroughs').insert({ name: formName, region_id: formRegionId });
        if (error) throw error;
        toast.success('Borough added');
      }
      closeDialog();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save borough');
    }
  };

  const savePostcode = async () => {
    if (!formName.trim() || !formBoroughId) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      if (editingItem) {
        const { error } = await supabase.from('postcode_prefixes').update({ 
          prefix: formName.toUpperCase(), 
          borough_id: formBoroughId,
          ...formServices 
        }).eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Postcode updated');
      } else {
        const { error } = await supabase.from('postcode_prefixes').insert({ 
          prefix: formName.toUpperCase(), 
          borough_id: formBoroughId,
          ...formServices 
        });
        if (error) throw error;
        toast.success('Postcode added');
      }
      closeDialog();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save postcode');
    }
  };

  // Delete functions
  const deleteRegion = async (id: string) => {
    if (!confirm('Delete this region and all its boroughs/postcodes?')) return;
    try {
      const { error } = await supabase.from('coverage_regions').delete().eq('id', id);
      if (error) throw error;
      toast.success('Region deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const deleteBorough = async (id: string) => {
    if (!confirm('Delete this borough and all its postcodes?')) return;
    try {
      const { error } = await supabase.from('coverage_boroughs').delete().eq('id', id);
      if (error) throw error;
      toast.success('Borough deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const deletePostcode = async (id: string) => {
    if (!confirm('Delete this postcode?')) return;
    try {
      const { error } = await supabase.from('postcode_prefixes').delete().eq('id', id);
      if (error) throw error;
      toast.success('Postcode deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coverage Management</h1>
          <p className="text-muted-foreground text-sm">Manage regions, boroughs, and postcodes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openAddRegion}>
            <Plus className="h-4 w-4 mr-1" /> Region
          </Button>
          <Button variant="outline" onClick={() => openAddBorough()}>
            <Plus className="h-4 w-4 mr-1" /> Borough
          </Button>
          <Button onClick={() => openAddPostcode()}>
            <Plus className="h-4 w-4 mr-1" /> Postcode
          </Button>
        </div>
      </div>

      {/* Simple Tree View */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Coverage Areas ({regions.length} regions, {postcodes.length} postcodes)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {regions.map((region) => {
              const regionBoroughs = getBoroughsForRegion(region.id);
              const isExpanded = expandedRegions.has(region.id);
              const postcodeCount = regionBoroughs.reduce((sum, b) => sum + getPostcodesForBorough(b.id).length, 0);
              
              return (
                <div key={region.id}>
                  {/* Region Row */}
                  <div 
                    className={`flex items-center justify-between px-4 py-2 hover:bg-muted/50 cursor-pointer ${!region.is_active ? 'opacity-50' : ''}`}
                    onClick={() => toggleRegion(region.id)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-medium">{region.name}</span>
                      <Badge variant="secondary" className="text-xs">{postcodeCount} postcodes</Badge>
                    </div>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openAddBorough(region.id)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEditRegion(region)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => deleteRegion(region.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Boroughs & Postcodes */}
                  {isExpanded && (
                    <div className="bg-muted/30">
                      {regionBoroughs.length === 0 ? (
                        <div className="px-10 py-2 text-sm text-muted-foreground italic">
                          No boroughs - <button className="text-primary underline" onClick={() => openAddBorough(region.id)}>add one</button>
                        </div>
                      ) : (
                        regionBoroughs.map((borough) => {
                          const boroughPostcodes = getPostcodesForBorough(borough.id);
                          return (
                            <div key={borough.id} className="border-t border-border/50">
                              {/* Borough Row */}
                              <div className={`flex items-center justify-between px-8 py-2 ${!borough.is_active ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{borough.name}</span>
                                  <Badge variant="outline" className="text-xs">{boroughPostcodes.length}</Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => openAddPostcode(borough.id)}>
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => openEditBorough(borough)}>
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => deleteBorough(borough.id)}>
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Postcodes */}
                              {boroughPostcodes.length > 0 && (
                                <div className="px-12 pb-2 flex flex-wrap gap-1">
                                  {boroughPostcodes.map((postcode) => (
                                    <div 
                                      key={postcode.id} 
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded text-xs border cursor-pointer hover:bg-primary/5"
                                      onClick={() => openEditPostcode(postcode)}
                                    >
                                      <span className="font-mono font-medium">{postcode.prefix}</span>
                                      {postcode.domestic_cleaning && <span className="text-green-600">D</span>}
                                      {postcode.airbnb_cleaning && <span className="text-blue-600">A</span>}
                                      {postcode.end_of_tenancy && <span className="text-orange-600">E</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="text-xs text-muted-foreground flex gap-4">
        <span><span className="text-green-600 font-bold">D</span> = Domestic</span>
        <span><span className="text-blue-600 font-bold">A</span> = Airbnb</span>
        <span><span className="text-orange-600 font-bold">E</span> = End of Tenancy</span>
      </div>

      {/* Region Dialog */}
      <Dialog open={dialogType === 'region'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Region' : 'Add Region'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Region Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Hackney, Essex - Basildon"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={saveRegion}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Borough Dialog */}
      <Dialog open={dialogType === 'borough'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Borough' : 'Add Borough'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={formRegionId} onValueChange={setFormRegionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Borough Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., General, Central"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={saveBorough}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Postcode Dialog */}
      <Dialog open={dialogType === 'postcode'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Postcode' : 'Add Postcode'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Borough</Label>
              <Select value={formBoroughId} onValueChange={setFormBoroughId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select borough" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => {
                    const regionBoroughs = getBoroughsForRegion(region.id);
                    if (regionBoroughs.length === 0) return null;
                    return (
                      <div key={region.id}>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50">{region.name}</div>
                        {regionBoroughs.map((borough) => (
                          <SelectItem key={borough.id} value={borough.id}>{borough.name}</SelectItem>
                        ))}
                      </div>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Postcode Prefix</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value.toUpperCase())}
                placeholder="e.g., E1, SW1, RM10"
              />
            </div>
            <div className="space-y-2">
              <Label>Services</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Domestic Cleaning</span>
                  <Switch
                    checked={formServices.domestic_cleaning}
                    onCheckedChange={(checked) => setFormServices(prev => ({ ...prev, domestic_cleaning: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Airbnb Cleaning</span>
                  <Switch
                    checked={formServices.airbnb_cleaning}
                    onCheckedChange={(checked) => setFormServices(prev => ({ ...prev, airbnb_cleaning: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">End of Tenancy</span>
                  <Switch
                    checked={formServices.end_of_tenancy}
                    onCheckedChange={(checked) => setFormServices(prev => ({ ...prev, end_of_tenancy: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            {editingItem && (
              <Button variant="destructive" onClick={() => { deletePostcode(editingItem.id); closeDialog(); }} className="mr-auto">
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={savePostcode}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoverageManagement;