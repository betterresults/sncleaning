import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation, salesAgentNavigation } from '@/lib/navigationItems';
import { supabase } from '@/integrations/supabase/client';
import { Folder, Image, Search, Calendar, MapPin, User, ChevronRight, ArrowLeft, Download, Eye, Share2, Copy, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import StaffGuard from '@/components/StaffGuard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface PhotoFolder {
  key: string;
  label: string;
  count: number;
  subLabel?: string;
  postcodes?: string[];
  dates?: string[];
}

interface CleaningPhoto {
  id: string;
  file_path: string;
  photo_type: string;
  caption: string | null;
  damage_details: string | null;
  created_at: string;
  booking_id: number;
  booking_date: string;
  postcode: string;
  customer_id: number;
  cleaner_id: number;
}

type GroupBy = 'date' | 'postcode' | 'customer' | 'cleaner';

const PhotoManagement = () => {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<PhotoFolder[]>([]);
  const [photos, setPhotos] = useState<CleaningPhoto[]>([]);
  const [groupBy, setGroupBy] = useState<GroupBy>('date');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<CleaningPhoto | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Customer/Cleaner name caches
  const [customerNames, setCustomerNames] = useState<Record<number, string>>({});
  const [cleanerNames, setCleanerNames] = useState<Record<number, string>>({});

  const navigation = userRole === 'sales_agent' ? salesAgentNavigation : adminNavigation;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Fetch all photos and group them
  useEffect(() => {
    fetchPhotosAndGroup();
  }, [groupBy]);

  const fetchPhotosAndGroup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cleaning_photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allPhotos = data || [];
      
      // Fetch customer names
      const customerIds = [...new Set(allPhotos.map(p => p.customer_id))];
      if (customerIds.length > 0) {
        const { data: customers } = await supabase
          .from('customers')
          .select('id, first_name, last_name, full_name')
          .in('id', customerIds);
        
        const names: Record<number, string> = {};
        customers?.forEach(c => {
          names[c.id] = c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || `Customer #${c.id}`;
        });
        setCustomerNames(names);
      }

      // Fetch cleaner names
      const cleanerIds = [...new Set(allPhotos.map(p => p.cleaner_id))];
      if (cleanerIds.length > 0) {
        const { data: cleaners } = await supabase
          .from('cleaners')
          .select('id, first_name, last_name, full_name')
          .in('id', cleanerIds);
        
        const names: Record<number, string> = {};
        cleaners?.forEach(c => {
          names[c.id] = c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || `Cleaner #${c.id}`;
        });
        setCleanerNames(names);
      }

      // Group photos into folders
      const grouped = new Map<string, CleaningPhoto[]>();
      
      allPhotos.forEach(photo => {
        let key: string;
        switch (groupBy) {
          case 'date':
            key = photo.booking_date;
            break;
          case 'postcode':
            key = photo.postcode || 'Unknown';
            break;
          case 'customer':
            key = String(photo.customer_id);
            break;
          case 'cleaner':
            key = String(photo.cleaner_id);
            break;
          default:
            key = photo.booking_date;
        }
        
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(photo);
      });

      // Convert to folder array with additional context
      const folderList: PhotoFolder[] = Array.from(grouped.entries()).map(([key, folderPhotos]) => {
        let label = key;
        let subLabel = `${folderPhotos.length} photos`;
        
        // Get unique postcodes for this folder
        const uniquePostcodes = [...new Set(folderPhotos.map(p => p.postcode).filter(Boolean))];
        // Get unique dates for this folder
        const uniqueDates = [...new Set(folderPhotos.map(p => {
          try {
            return format(parseISO(p.booking_date), 'dd MMM');
          } catch {
            return p.booking_date;
          }
        }))];
        
        switch (groupBy) {
          case 'date':
            try {
              label = format(parseISO(key), 'dd MMM yyyy');
            } catch {
              label = key;
            }
            break;
          case 'customer':
            label = customerNames[Number(key)] || `Customer #${key}`;
            break;
          case 'cleaner':
            label = cleanerNames[Number(key)] || `Cleaner #${key}`;
            break;
        }
        
        return { 
          key, 
          label, 
          count: folderPhotos.length, 
          subLabel,
          postcodes: groupBy !== 'postcode' ? uniquePostcodes : undefined,
          dates: groupBy === 'postcode' ? uniqueDates : undefined
        };
      });

      // Sort folders
      folderList.sort((a, b) => {
        if (groupBy === 'date') {
          return b.key.localeCompare(a.key); // Newest first
        }
        return a.label.localeCompare(b.label);
      });

      setFolders(folderList);
      setPhotos(allPhotos);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredFolders = () => {
    if (!searchQuery) return folders;
    const query = searchQuery.toLowerCase();
    return folders.filter(f => 
      f.label.toLowerCase().includes(query) || 
      f.key.toLowerCase().includes(query) ||
      f.postcodes?.some(p => p.toLowerCase().includes(query)) ||
      f.subLabel?.toLowerCase().includes(query)
    );
  };

  const handleShareFolder = async (folder: PhotoFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Use production domain for shareable URLs
    const baseUrl = 'https://account.sncleaningservices.co.uk';
    const shareUrl = `${baseUrl}/photos/${groupBy}/${encodeURIComponent(folder.key)}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(folder.key);
      toast({
        title: "Link copied!",
        description: "Share URL has been copied to clipboard",
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const getFolderPhotos = () => {
    if (!selectedFolder) return [];
    return photos.filter(photo => {
      switch (groupBy) {
        case 'date':
          return photo.booking_date === selectedFolder;
        case 'postcode':
          return (photo.postcode || 'Unknown') === selectedFolder;
        case 'customer':
          return String(photo.customer_id) === selectedFolder;
        case 'cleaner':
          return String(photo.cleaner_id) === selectedFolder;
        default:
          return false;
      }
    });
  };

  const getPhotoUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('cleaning.photos')
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl || null;
  };

  const handleViewPhoto = async (photo: CleaningPhoto) => {
    setSelectedPhoto(photo);
    const url = await getPhotoUrl(photo.file_path);
    setPhotoUrl(url);
  };

  const handleDownloadPhoto = async (photo: CleaningPhoto) => {
    const url = await getPhotoUrl(photo.file_path);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = photo.file_path.split('/').pop() || 'photo';
      link.click();
    }
  };

  const getGroupIcon = () => {
    switch (groupBy) {
      case 'date': return <Calendar className="h-4 w-4" />;
      case 'postcode': return <MapPin className="h-4 w-4" />;
      case 'customer': return <User className="h-4 w-4" />;
      case 'cleaner': return <User className="h-4 w-4" />;
    }
  };

  const selectedFolderLabel = folders.find(f => f.key === selectedFolder)?.label || selectedFolder;

  return (
    <StaffGuard>
      <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full bg-gray-50">
          <UnifiedHeader 
            title=""
            user={user}
            userRole={userRole}
            onSignOut={handleSignOut}
          />
          <div className="flex flex-1 w-full">
            <UnifiedSidebar 
              navigationItems={navigation}
              user={user}
              userRole={userRole}
              onSignOut={handleSignOut}
            />
            <SidebarInset className="flex-1 flex flex-col p-0 m-0 overflow-x-hidden">
              <main className="flex-1 bg-gray-50 m-0 px-4 md:px-6 py-4 md:py-6 space-y-6 w-full">
                <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {selectedFolder && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedFolder(null)}
                            className="h-8 w-8"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                        )}
                        <CardTitle className="text-xl font-semibold flex items-center gap-2">
                          <Image className="h-5 w-5" />
                          {selectedFolder ? selectedFolderLabel : 'Photo Management'}
                        </CardTitle>
                      </div>
                      
                      {!selectedFolder && (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search folders..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-9 w-full sm:w-64"
                            />
                          </div>
                          
                          <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
                            <TabsList>
                              <TabsTrigger value="date" className="gap-1">
                                <Calendar className="h-3 w-3" /> Date
                              </TabsTrigger>
                              <TabsTrigger value="postcode" className="gap-1">
                                <MapPin className="h-3 w-3" /> Postcode
                              </TabsTrigger>
                              <TabsTrigger value="customer" className="gap-1">
                                <User className="h-3 w-3" /> Customer
                              </TabsTrigger>
                              <TabsTrigger value="cleaner" className="gap-1">
                                <User className="h-3 w-3" /> Cleaner
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 sm:p-6 pt-0">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : selectedFolder ? (
                      // Photo grid view
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {getFolderPhotos().map((photo) => (
                          <PhotoThumbnail
                            key={photo.id}
                            photo={photo}
                            onView={() => handleViewPhoto(photo)}
                            onDownload={() => handleDownloadPhoto(photo)}
                          />
                        ))}
                      </div>
                    ) : (
                      // Folder grid view
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {getFilteredFolders().map((folder) => (
                          <div
                            key={folder.key}
                            className="relative flex flex-col items-center p-4 rounded-xl border border-border hover:border-primary hover:bg-accent transition-all group cursor-pointer"
                            onClick={() => setSelectedFolder(folder.key)}
                          >
                            {/* Share button */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              onClick={(e) => handleShareFolder(folder, e)}
                            >
                              {copiedId === folder.key ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Share2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            
                            <div className="relative mb-2">
                              <Folder className="h-16 w-16 text-amber-500 group-hover:text-amber-600 transition-colors" fill="currentColor" />
                              <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-medium px-1.5 py-0.5 rounded-full">
                                {folder.count}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-center line-clamp-2">{folder.label}</span>
                            <span className="text-xs text-muted-foreground mt-1">{folder.subLabel}</span>
                            
                            {/* Postcodes tags */}
                            {folder.postcodes && folder.postcodes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2 justify-center">
                                {folder.postcodes.slice(0, 3).map((pc) => (
                                  <span key={pc} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                    {pc}
                                  </span>
                                ))}
                                {folder.postcodes.length > 3 && (
                                  <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                    +{folder.postcodes.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Dates tags for postcode grouping */}
                            {folder.dates && folder.dates.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2 justify-center">
                                {folder.dates.slice(0, 2).map((date) => (
                                  <span key={date} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                    {date}
                                  </span>
                                ))}
                                {folder.dates.length > 2 && (
                                  <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                    +{folder.dates.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {getFilteredFolders().length === 0 && (
                          <div className="col-span-full text-center py-12 text-muted-foreground">
                            No folders found
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </main>
            </SidebarInset>
          </div>
        </div>
        
        {/* Photo viewer dialog */}
        <Dialog open={!!selectedPhoto} onOpenChange={() => { setSelectedPhoto(null); setPhotoUrl(null); }}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                {selectedPhoto?.photo_type} Photo
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              {photoUrl ? (
                <img src={photoUrl} alt="Cleaning photo" className="w-full rounded-lg" />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
              {selectedPhoto && (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{selectedPhoto.photo_type}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Booking:</span>
                    <span>#{selectedPhoto.booking_id}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{format(parseISO(selectedPhoto.booking_date), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Postcode:</span>
                    <span>{selectedPhoto.postcode}</span>
                  </div>
                  {selectedPhoto.caption && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Caption:</span>
                      <span>{selectedPhoto.caption}</span>
                    </div>
                  )}
                  {selectedPhoto.damage_details && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Damage:</span>
                      <span className="text-red-600">{selectedPhoto.damage_details}</span>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </SidebarProvider>
    </StaffGuard>
  );
};

// Thumbnail component
const PhotoThumbnail = ({ 
  photo, 
  onView, 
  onDownload 
}: { 
  photo: CleaningPhoto; 
  onView: () => void; 
  onDownload: () => void;
}) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadThumb = async () => {
      const { data } = await supabase.storage
        .from('cleaning.photos')
        .createSignedUrl(photo.file_path, 3600);
      setThumbUrl(data?.signedUrl || null);
      setLoading(false);
    };
    loadThumb();
  }, [photo.file_path]);

  return (
    <div className="relative group rounded-xl overflow-hidden border border-border bg-muted aspect-square">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : thumbUrl ? (
        <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="flex items-center justify-center h-full">
          <Image className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button size="icon" variant="secondary" onClick={onView} className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" onClick={onDownload} className="h-8 w-8">
          <Download className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Type badge */}
      <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded capitalize">
        {photo.photo_type}
      </span>
    </div>
  );
};

export default PhotoManagement;
