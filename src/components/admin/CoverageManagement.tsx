import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, MapPin, Building, Map } from 'lucide-react';

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
  
  // Dialog states
  const [regionDialogOpen, setRegionDialogOpen] = useState(false);
  const [boroughDialogOpen, setBoroughDialogOpen] = useState(false);
  const [postcodeDialogOpen, setPostcodeDialogOpen] = useState(false);
  
  // Form states
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [editingBorough, setEditingBorough] = useState<Borough | null>(null);
  const [editingPostcode, setEditingPostcode] = useState<PostcodePrefix | null>(null);
  
  const [newRegionName, setNewRegionName] = useState('');
  const [newBoroughName, setNewBoroughName] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [newPostcodePrefix, setNewPostcodePrefix] = useState('');
  const [selectedBoroughId, setSelectedBoroughId] = useState('');
  const [newPostcodeServices, setNewPostcodeServices] = useState({
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
        supabase.from('coverage_regions').select('*').order('display_order'),
        supabase.from('coverage_boroughs').select('*').order('display_order'),
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

  // Region CRUD
  const saveRegion = async () => {
    if (!newRegionName.trim()) return;
    
    try {
      if (editingRegion) {
        const { error } = await supabase
          .from('coverage_regions')
          .update({ name: newRegionName })
          .eq('id', editingRegion.id);
        if (error) throw error;
        toast.success('Region updated');
      } else {
        const maxOrder = Math.max(...regions.map(r => r.display_order), 0);
        const { error } = await supabase
          .from('coverage_regions')
          .insert({ name: newRegionName, display_order: maxOrder + 1 });
        if (error) throw error;
        toast.success('Region added');
      }
      setRegionDialogOpen(false);
      setNewRegionName('');
      setEditingRegion(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save region');
    }
  };

  const deleteRegion = async (id: string) => {
    if (!confirm('Delete this region and all its boroughs/postcodes?')) return;
    try {
      const { error } = await supabase.from('coverage_regions').delete().eq('id', id);
      if (error) throw error;
      toast.success('Region deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete region');
    }
  };

  const toggleRegionActive = async (region: Region) => {
    try {
      const { error } = await supabase
        .from('coverage_regions')
        .update({ is_active: !region.is_active })
        .eq('id', region.id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update region');
    }
  };

  // Borough CRUD
  const saveBorough = async () => {
    if (!newBoroughName.trim() || !selectedRegionId) return;
    
    try {
      if (editingBorough) {
        const { error } = await supabase
          .from('coverage_boroughs')
          .update({ name: newBoroughName, region_id: selectedRegionId })
          .eq('id', editingBorough.id);
        if (error) throw error;
        toast.success('Borough updated');
      } else {
        const regionBoroughs = boroughs.filter(b => b.region_id === selectedRegionId);
        const maxOrder = Math.max(...regionBoroughs.map(b => b.display_order), 0);
        const { error } = await supabase
          .from('coverage_boroughs')
          .insert({ name: newBoroughName, region_id: selectedRegionId, display_order: maxOrder + 1 });
        if (error) throw error;
        toast.success('Borough added');
      }
      setBoroughDialogOpen(false);
      setNewBoroughName('');
      setSelectedRegionId('');
      setEditingBorough(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save borough');
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
      toast.error(error.message || 'Failed to delete borough');
    }
  };

  const toggleBoroughActive = async (borough: Borough) => {
    try {
      const { error } = await supabase
        .from('coverage_boroughs')
        .update({ is_active: !borough.is_active })
        .eq('id', borough.id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update borough');
    }
  };

  // Postcode CRUD
  const savePostcode = async () => {
    if (!newPostcodePrefix.trim() || !selectedBoroughId) return;
    
    try {
      if (editingPostcode) {
        const { error } = await supabase
          .from('postcode_prefixes')
          .update({ 
            prefix: newPostcodePrefix.toUpperCase(), 
            borough_id: selectedBoroughId,
            ...newPostcodeServices 
          })
          .eq('id', editingPostcode.id);
        if (error) throw error;
        toast.success('Postcode updated');
      } else {
        const { error } = await supabase
          .from('postcode_prefixes')
          .insert({ 
            prefix: newPostcodePrefix.toUpperCase(), 
            borough_id: selectedBoroughId,
            ...newPostcodeServices 
          });
        if (error) throw error;
        toast.success('Postcode added');
      }
      setPostcodeDialogOpen(false);
      setNewPostcodePrefix('');
      setSelectedBoroughId('');
      setEditingPostcode(null);
      setNewPostcodeServices({ domestic_cleaning: true, airbnb_cleaning: true, end_of_tenancy: true });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save postcode');
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
      toast.error(error.message || 'Failed to delete postcode');
    }
  };

  const togglePostcodeService = async (postcode: PostcodePrefix, service: keyof typeof newPostcodeServices) => {
    try {
      const { error } = await supabase
        .from('postcode_prefixes')
        .update({ [service]: !postcode[service] })
        .eq('id', postcode.id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update postcode');
    }
  };

  const getBoroughsForRegion = (regionId: string) => boroughs.filter(b => b.region_id === regionId);
  const getPostcodesForBorough = (boroughId: string) => postcodes.filter(p => p.borough_id === boroughId);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coverage Management</h1>
          <p className="text-muted-foreground">Manage service coverage areas by region, borough, and postcode</p>
        </div>
      </div>

      <Tabs defaultValue="regions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="regions" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Regions
          </TabsTrigger>
          <TabsTrigger value="boroughs" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Boroughs
          </TabsTrigger>
          <TabsTrigger value="postcodes" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Postcodes
          </TabsTrigger>
        </TabsList>

        {/* Regions Tab */}
        <TabsContent value="regions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Regions</CardTitle>
              <Dialog open={regionDialogOpen} onOpenChange={setRegionDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingRegion(null); setNewRegionName(''); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Region
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingRegion ? 'Edit Region' : 'Add Region'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="regionName">Region Name</Label>
                      <Input
                        id="regionName"
                        value={newRegionName}
                        onChange={(e) => setNewRegionName(e.target.value)}
                        placeholder="e.g., East London"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={saveRegion}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {regions.map((region) => (
                  <div key={region.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={region.is_active}
                        onCheckedChange={() => toggleRegionActive(region)}
                      />
                      <span className={!region.is_active ? 'text-muted-foreground' : ''}>{region.name}</span>
                      <Badge variant="secondary">{getBoroughsForRegion(region.id).length} boroughs</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingRegion(region);
                          setNewRegionName(region.name);
                          setRegionDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteRegion(region.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Boroughs Tab */}
        <TabsContent value="boroughs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Boroughs</CardTitle>
              <Dialog open={boroughDialogOpen} onOpenChange={setBoroughDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingBorough(null); setNewBoroughName(''); setSelectedRegionId(''); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Borough
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingBorough ? 'Edit Borough' : 'Add Borough'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Region</Label>
                      <Select value={selectedRegionId} onValueChange={setSelectedRegionId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.filter(r => r.is_active).map((region) => (
                            <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boroughName">Borough Name</Label>
                      <Input
                        id="boroughName"
                        value={newBoroughName}
                        onChange={(e) => setNewBoroughName(e.target.value)}
                        placeholder="e.g., Hackney"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={saveBorough}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="space-y-2">
                {regions.filter(r => r.is_active).map((region) => (
                  <AccordionItem key={region.id} value={region.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span>{region.name}</span>
                        <Badge variant="secondary">{getBoroughsForRegion(region.id).length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {getBoroughsForRegion(region.id).map((borough) => (
                          <div key={borough.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={borough.is_active}
                                onCheckedChange={() => toggleBoroughActive(borough)}
                              />
                              <span className={!borough.is_active ? 'text-muted-foreground' : ''}>{borough.name}</span>
                              <Badge variant="outline">{getPostcodesForBorough(borough.id).length} postcodes</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingBorough(borough);
                                  setNewBoroughName(borough.name);
                                  setSelectedRegionId(borough.region_id);
                                  setBoroughDialogOpen(true);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteBorough(borough.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {getBoroughsForRegion(region.id).length === 0 && (
                          <p className="text-sm text-muted-foreground p-2">No boroughs added yet</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Postcodes Tab */}
        <TabsContent value="postcodes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Postcode Prefixes</CardTitle>
              <Dialog open={postcodeDialogOpen} onOpenChange={setPostcodeDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { 
                    setEditingPostcode(null); 
                    setNewPostcodePrefix(''); 
                    setSelectedBoroughId('');
                    setNewPostcodeServices({ domestic_cleaning: true, airbnb_cleaning: true, end_of_tenancy: true });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Postcode
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingPostcode ? 'Edit Postcode' : 'Add Postcode'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Borough</Label>
                      <Select value={selectedBoroughId} onValueChange={setSelectedBoroughId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select borough" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.filter(r => r.is_active).map((region) => (
                            <React.Fragment key={region.id}>
                              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{region.name}</div>
                              {getBoroughsForRegion(region.id).filter(b => b.is_active).map((borough) => (
                                <SelectItem key={borough.id} value={borough.id}>{borough.name}</SelectItem>
                              ))}
                            </React.Fragment>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postcodePrefix">Postcode Prefix</Label>
                      <Input
                        id="postcodePrefix"
                        value={newPostcodePrefix}
                        onChange={(e) => setNewPostcodePrefix(e.target.value.toUpperCase())}
                        placeholder="e.g., E1, SW1"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>Services Available</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Domestic Cleaning</span>
                          <Switch
                            checked={newPostcodeServices.domestic_cleaning}
                            onCheckedChange={(checked) => setNewPostcodeServices(prev => ({ ...prev, domestic_cleaning: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Airbnb Cleaning</span>
                          <Switch
                            checked={newPostcodeServices.airbnb_cleaning}
                            onCheckedChange={(checked) => setNewPostcodeServices(prev => ({ ...prev, airbnb_cleaning: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">End of Tenancy</span>
                          <Switch
                            checked={newPostcodeServices.end_of_tenancy}
                            onCheckedChange={(checked) => setNewPostcodeServices(prev => ({ ...prev, end_of_tenancy: checked }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={savePostcode}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="space-y-2">
                {regions.filter(r => r.is_active).map((region) => (
                  <AccordionItem key={region.id} value={region.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span>{region.name}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {getBoroughsForRegion(region.id).filter(b => b.is_active).map((borough) => (
                          <div key={borough.id} className="space-y-2">
                            <h4 className="font-medium text-sm">{borough.name}</h4>
                            <div className="flex flex-wrap gap-2">
                              {getPostcodesForBorough(borough.id).map((postcode) => (
                                <div 
                                  key={postcode.id} 
                                  className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm"
                                >
                                  <span className="font-mono font-medium">{postcode.prefix}</span>
                                  <div className="flex gap-1">
                                    {postcode.domestic_cleaning && <Badge variant="outline" className="text-xs">D</Badge>}
                                    {postcode.airbnb_cleaning && <Badge variant="outline" className="text-xs">A</Badge>}
                                    {postcode.end_of_tenancy && <Badge variant="outline" className="text-xs">E</Badge>}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => {
                                      setEditingPostcode(postcode);
                                      setNewPostcodePrefix(postcode.prefix);
                                      setSelectedBoroughId(postcode.borough_id);
                                      setNewPostcodeServices({
                                        domestic_cleaning: postcode.domestic_cleaning,
                                        airbnb_cleaning: postcode.airbnb_cleaning,
                                        end_of_tenancy: postcode.end_of_tenancy,
                                      });
                                      setPostcodeDialogOpen(true);
                                    }}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => deletePostcode(postcode.id)}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              ))}
                              {getPostcodesForBorough(borough.id).length === 0 && (
                                <p className="text-sm text-muted-foreground">No postcodes added</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Legend:</strong> D = Domestic Cleaning, A = Airbnb Cleaning, E = End of Tenancy
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoverageManagement;
