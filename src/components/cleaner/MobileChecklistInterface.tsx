import React, { useState, useEffect } from 'react';
import { useCleaningChecklist } from '@/hooks/useCleaningChecklist';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModernPropertyConfigDialog } from './ModernPropertyConfigDialog';
import { TaskCommentDialog } from './TaskCommentDialog';
import { ChevronRight, ChevronDown, Check, Camera, MessageSquare, Save, ArrowLeft, Home, Settings, Edit, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MobileChecklistInterfaceProps {
  bookingId: number;
  cleanerId: number;
  onClose: () => void;
}

interface PropertyConfig {
  bedrooms: number;
  bathrooms: number;
  living_rooms: number;
  additional_rooms?: Array<{ type: string; count: number }>;
}

interface ChecklistSection {
  id: string;
  name: string;
  tasks: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
  note?: string;
  completed: boolean;
  progress: number;
}

export function MobileChecklistInterface({ bookingId, cleanerId, onClose }: MobileChecklistInterfaceProps) {
  const {
    currentChecklist,
    templates,
    loading,
    saving,
    updateTaskCompletion,
    updatePropertyConfig,
    parsePropertyConfig,
    fetchChecklists,
  } = useCleaningChecklist(bookingId);

  // Fetch checklists when component mounts
  useEffect(() => {
    if (cleanerId) {
      fetchChecklists(cleanerId);
    } else {
      fetchChecklists();
    }
  }, [bookingId, cleanerId, fetchChecklists]);

  const [currentStep, setCurrentStep] = useState<'overview' | 'checklist' | 'room'>('overview');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [language, setLanguage] = useState<'english' | 'bulgarian'>('english');
  const [propertyConfig, setPropertyConfig] = useState<PropertyConfig>({
    bedrooms: 1,
    bathrooms: 1,
    living_rooms: 1,
  });
  const [sections, setSections] = useState<ChecklistSection[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [customerData, setCustomerData] = useState<any>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { toast } = useToast();

  // Parse property configuration when checklist loads
  useEffect(() => {
    if (currentChecklist) {
      const parsed = typeof currentChecklist.property_config === 'string' 
        ? parsePropertyConfig(currentChecklist.property_config)
        : currentChecklist.property_config;
      setPropertyConfig(parsed);
      setLanguage(currentChecklist.language_preference || 'english');
    }
  }, [currentChecklist, parsePropertyConfig]);

  // Generate sections based on template and property config
  useEffect(() => {
    if (currentChecklist && templates.length > 0) {
      const template = templates.find(t => t.id === currentChecklist.template_id);
      if (!template) return;

      const newSections: ChecklistSection[] = [];
      const config = propertyConfig || (typeof currentChecklist.property_config === 'string' 
        ? parsePropertyConfig(currentChecklist.property_config)
        : currentChecklist.property_config);
      const { rooms } = template.template_data;

      // Helper function to create sections
      const createSection = (roomKey: string, displayName: string, tasks: any[]) => {
        const roomData = currentChecklist.checklist_data?.[roomKey] || {};
        const sectionTasks = tasks.map(task => ({
          id: task.id,
          text: language === 'english' ? task.en : task.bg,
          completed: roomData[task.id] || false,
        }));
        
        const completedTasks = sectionTasks.filter(t => t.completed).length;
        const progress = sectionTasks.length > 0 ? (completedTasks / sectionTasks.length) * 100 : 0;
        
        return {
          id: roomKey,
          name: displayName,
          tasks: sectionTasks,
          note: rooms[roomKey.split('_')[0]]?.note ? 
            (language === 'english' ? rooms[roomKey.split('_')[0]].note.en : rooms[roomKey.split('_')[0]].note.bg) : 
            undefined,
          completed: progress === 100,
          progress,
        };
      };

      // Add kitchen (always single)
      if (rooms.kitchen) {
        newSections.push(createSection('kitchen_1', 
          language === 'english' ? 'Kitchen' : 'Кухня', 
          rooms.kitchen.tasks
        ));
      }

      // Add bedrooms
      for (let i = 1; i <= config.bedrooms; i++) {
        if (rooms.bedroom) {
          newSections.push(createSection(`bedroom_${i}`, 
            language === 'english' ? `Bedroom ${i}` : `Спалня ${i}`, 
            rooms.bedroom.tasks
          ));
        }
      }

      // Add bathrooms
      for (let i = 1; i <= config.bathrooms; i++) {
        if (rooms.bathroom) {
          newSections.push(createSection(`bathroom_${i}`, 
            language === 'english' ? `Bathroom ${i}` : `Баня ${i}`, 
            rooms.bathroom.tasks
          ));
        }
      }

      // Add living rooms
      for (let i = 1; i <= config.living_rooms; i++) {
        if (rooms.living_room) {
          newSections.push(createSection(`living_room_${i}`, 
            language === 'english' ? `Living Room ${i}` : `Дневна ${i}`, 
            rooms.living_room.tasks
          ));
        }
      }

      // Add additional rooms
      config.additional_rooms?.forEach(({ type, count }) => {
        const roomType = type.toLowerCase().replace(/\s+/g, '_');
        if (rooms[roomType]) {
          for (let i = 1; i <= count; i++) {
            newSections.push(createSection(`${roomType}_${i}`, 
              `${type} ${i}`, 
              rooms[roomType].tasks
            ));
          }
        }
      });

      setSections(newSections);

      // Calculate overall progress
      const totalTasks = newSections.reduce((sum, section) => sum + section.tasks.length, 0);
      const completedTasks = newSections.reduce((sum, section) => 
        sum + section.tasks.filter(t => t.completed).length, 0
      );
      setOverallProgress(totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0);
    }
  }, [currentChecklist, templates, language, propertyConfig, parsePropertyConfig]);

  // Fetch customer data
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!currentChecklist) return;
      
      try {
        const { data: booking } = await supabase
          .from('bookings')
          .select('*, customers(*)')
          .eq('id', currentChecklist.booking_id)
          .single();
        
        if (booking) {
          setCustomerData(booking);
        }
      } catch (error) {
        console.error('Error fetching customer data:', error);
      }
    };

    fetchCustomerData();
  }, [currentChecklist]);

  const handleTaskToggle = async (roomId: string, taskId: string, completed: boolean) => {
    if (!currentChecklist) return;
    
    await updateTaskCompletion(currentChecklist.id, roomId, taskId, completed);
    
    // Update local state
    setSections(prevSections => 
      prevSections.map(section => {
        if (section.id === roomId) {
          const updatedTasks = section.tasks.map(task => 
            task.id === taskId ? { ...task, completed } : task
          );
          const completedTasks = updatedTasks.filter(t => t.completed).length;
          const progress = updatedTasks.length > 0 ? (completedTasks / updatedTasks.length) * 100 : 0;
          
          return {
            ...section,
            tasks: updatedTasks,
            completed: progress === 100,
            progress,
          };
        }
        return section;
      })
    );
  };

  const handlePropertyConfigSave = (config: PropertyConfig) => {
    setPropertyConfig(config);
    if (currentChecklist) {
      updatePropertyConfig(currentChecklist.id, config);
    }
  };

  const handlePhotoUpload = async (file: File, roomId: string) => {
    if (!currentChecklist || !customerData) return;
    
    setUploadingPhoto(true);
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const bookingDate = new Date(customerData.date_time).toISOString().split('T')[0];
      const safePostcode = customerData.postcode?.toString().replace(/\s+/g, '').toUpperCase() || 'NA';
      const folderPath = `${customerData.id}_${safePostcode}_${bookingDate}_${customerData.customer}`;
      const filePath = `${folderPath}/checklist/${roomId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('cleaning.photos')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      // Save to database
      const { error: dbError } = await supabase
        .from('cleaning_photos')
        .insert({
          booking_id: customerData.id,
          customer_id: customerData.customer,
          cleaner_id: customerData.cleaner,
          file_path: filePath,
          photo_type: 'after',
          postcode: customerData.postcode,
          booking_date: bookingDate,
          caption: `Checklist photo - ${sections.find(s => s.id === roomId)?.name}`
        });

      if (dbError) throw dbError;

      toast({
        title: language === 'english' ? 'Photo uploaded!' : 'Снимката е качена!',
        description: language === 'english' ? 'Photo saved successfully.' : 'Снимката е запазена успешно.',
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveAndComplete = async () => {
    if (!currentChecklist) return;
    
    try {
      const { error } = await supabase
        .from('cleaning_checklists')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', currentChecklist.id);

      if (error) throw error;

      toast({
        title: language === 'english' ? 'Checklist Completed!' : 'Чеклистът е завършен!',
        description: language === 'english' ? 'All tasks have been saved successfully.' : 'Всички задачи са запазени успешно.',
      });

      onClose();
    } catch (error) {
      console.error('Error completing checklist:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete checklist',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading checklist...</p>
        </div>
      </div>
    );
  }

  if (!currentChecklist) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No checklist found</p>
          <Button onClick={onClose}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (currentStep === 'room') setCurrentStep('checklist');
              else if (currentStep === 'checklist') setCurrentStep('overview');
              else onClose();
            }}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {currentStep === 'room' ? 'Back to Checklist' : currentStep === 'checklist' ? 'Back' : 'Close'}
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'english' ? 'bulgarian' : 'english')}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              {language === 'english' ? 'EN' : 'BG'}
            </Button>
            {saving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground"></div>}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              {language === 'english' ? 'End of Tenancy Cleaning' : 'Почистване в края на наем'}
            </h1>
            <p className="text-sm opacity-90">
              {customerData?.customers?.first_name} {customerData?.customers?.last_name}
            </p>
          </div>
          <div className="text-right text-sm">
            <div className="font-medium">{Math.round(overallProgress)}%</div>
            <div className="opacity-90">Complete</div>
          </div>
        </div>
        
        <Progress value={overallProgress} className="mt-3 bg-primary-foreground/20" />
      </div>

      {/* Overview Step - Property Details + Start Button */}
      {currentStep === 'overview' && (
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          {/* Property Details */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Home className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">
                  {language === 'english' ? 'Property Details' : 'Детайли за имота'}
                </h2>
              </div>
              
              <div className="space-y-2 text-sm">
                <div><strong>Address:</strong> {customerData?.address}</div>
                <div><strong>Postcode:</strong> {customerData?.postcode}</div>
                <div><strong>Access:</strong> {customerData?.access}</div>
                {customerData?.parking_details && (
                  <div><strong>Parking:</strong> {customerData.parking_details}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Property Configuration */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">
                    {language === 'english' ? 'Property Configuration' : 'Конфигурация на имота'}
                  </h2>
                </div>
                <ModernPropertyConfigDialog
                  propertyConfig={propertyConfig}
                  language={language}
                  onSave={handlePropertyConfigSave}
                >
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    {language === 'english' ? 'Edit' : 'Промени'}
                  </Button>
                </ModernPropertyConfigDialog>
              </div>
              
              <div className="space-y-3 text-sm">
                {/* Property Basic Info */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-xs text-muted-foreground mb-1">
                      {language === 'english' ? 'Property Type' : 'Тип имот'}
                    </div>
                    <div className="font-medium">
                      {(propertyConfig as any)?.property_type === 'flat' ? (language === 'english' ? 'Flat' : 'Апартамент') :
                       (propertyConfig as any)?.property_type === 'house' ? (language === 'english' ? 'House' : 'Къща') :
                       (propertyConfig as any)?.property_type === 'studio' ? (language === 'english' ? 'Studio' : 'Студио') :
                       (propertyConfig as any)?.property_type === 'house_share' ? (language === 'english' ? 'House Share' : 'Споделена къща') :
                       (language === 'english' ? 'Flat' : 'Апартамент')}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-xs text-muted-foreground mb-1">
                      {language === 'english' ? 'Status' : 'Статус'}
                    </div>
                    <div className="font-medium">
                      {(propertyConfig as any)?.property_status === 'furnished' ? (language === 'english' ? 'Furnished' : 'Обзаведен') :
                       (propertyConfig as any)?.property_status === 'unfurnished' ? (language === 'english' ? 'Unfurnished' : 'Необзаведен') :
                       (propertyConfig as any)?.property_status === 'part_furnished' ? (language === 'english' ? 'Part Furnished' : 'Частично обзаведен') :
                       (language === 'english' ? 'Furnished' : 'Обзаведен')}
                    </div>
                  </div>
                </div>

                {/* Room Counts */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-muted/50 rounded p-2 text-center">
                    <div className="font-medium">{propertyConfig?.bedrooms || 1}</div>
                    <div className="text-xs text-muted-foreground">
                      {language === 'english' 
                        ? `Bedroom${(propertyConfig?.bedrooms || 1) > 1 ? 's' : ''}` 
                        : `Спалн${(propertyConfig?.bedrooms || 1) > 1 ? 'и' : 'я'}`}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded p-2 text-center">
                    <div className="font-medium">{propertyConfig?.bathrooms || 1}</div>
                    <div className="text-xs text-muted-foreground">
                      {language === 'english' 
                        ? `Bathroom${(propertyConfig?.bathrooms || 1) > 1 ? 's' : ''}` 
                        : `Бан${(propertyConfig?.bathrooms || 1) > 1 ? 'и' : 'я'}`}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded p-2 text-center">
                    <div className="font-medium">{propertyConfig?.living_rooms || 1}</div>
                    <div className="text-xs text-muted-foreground">
                      {language === 'english' 
                        ? `Living${(propertyConfig?.living_rooms || 1) > 1 ? 's' : ''}` 
                        : `Дневн${(propertyConfig?.living_rooms || 1) > 1 ? 'и' : 'а'}`}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded p-2 text-center">
                    <div className="font-medium">{(propertyConfig as any)?.wc || 0}</div>
                    <div className="text-xs text-muted-foreground">
                      {language === 'english' ? 'WC' : 'Тоалетни'}
                    </div>
                  </div>
                </div>

                {/* Oven Type */}
                {(propertyConfig as any)?.oven_type && (propertyConfig as any).oven_type !== 'no_oven' && (
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-xs text-muted-foreground mb-1">
                      {language === 'english' ? 'Oven Type' : 'Тип фурна'}
                    </div>
                    <div className="font-medium">
                      {(propertyConfig as any).oven_type === 'single' ? (language === 'english' ? 'Single Oven' : 'Единична фурна') :
                       (propertyConfig as any).oven_type === 'single_convection' ? (language === 'english' ? 'Single & Convection' : 'Единична и конвекционна') :
                       (propertyConfig as any).oven_type === 'double' ? (language === 'english' ? 'Double Oven' : 'Двойна фурна') :
                       (propertyConfig as any).oven_type === 'range' ? (language === 'english' ? 'Range Oven' : 'Голяма фурна') :
                       (propertyConfig as any).oven_type === 'aga' ? (language === 'english' ? 'AGA Oven' : 'AGA фурна') :
                       (language === 'english' ? 'Single Oven' : 'Единична фурна')}
                    </div>
                  </div>
                )}

                {/* Additional Features */}
                {(propertyConfig as any)?.additional_features && (propertyConfig as any).additional_features.length > 0 && (
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-xs text-muted-foreground mb-1">
                      {language === 'english' ? 'Additional Features' : 'Допълнителни характеристики'}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(propertyConfig as any).additional_features.map((feature: string) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature === 'utility_room' ? (language === 'english' ? 'Utility Room' : 'Перално помещение') :
                           feature === 'dining_room' ? (language === 'english' ? 'Dining Room' : 'Трапезария') :
                           feature === 'conservatory' ? (language === 'english' ? 'Conservatory' : 'Зимна градина') :
                           feature === 'study_room' ? (language === 'english' ? 'Study Room' : 'Кабинет') :
                           feature === 'separate_kitchen_living' ? (language === 'english' ? 'Separate Kitchen/Living' : 'Отделна кухня/дневна') :
                           feature === 'other_room' ? (language === 'english' ? 'Other Room' : 'Друго помещение') : feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services Summary */}
                {(
                  ((propertyConfig as any)?.blinds_cleaning && (propertyConfig as any).blinds_cleaning.length > 0) ||
                  ((propertyConfig as any)?.extra_services && (propertyConfig as any).extra_services.length > 0) ||
                  ((propertyConfig as any)?.carpet_cleaning && (propertyConfig as any).carpet_cleaning.length > 0) ||
                  ((propertyConfig as any)?.upholstery_cleaning && (propertyConfig as any).upholstery_cleaning.length > 0) ||
                  ((propertyConfig as any)?.mattress_cleaning && (propertyConfig as any).mattress_cleaning.length > 0)
                ) && (
                  <div className="bg-primary/10 rounded p-2">
                    <div className="text-xs text-primary mb-1 font-medium">
                      {language === 'english' ? 'Additional Services' : 'Допълнителни услуги'}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(propertyConfig as any).blinds_cleaning?.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {language === 'english' ? 'Blinds Cleaning' : 'Почистване на щори'} ({(propertyConfig as any).blinds_cleaning.reduce((total: number, item: any) => total + (item.quantity || 1), 0)})
                        </Badge>
                      )}
                      {(propertyConfig as any).extra_services?.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {language === 'english' ? 'Extra Services' : 'Допълнителни услуги'} ({(propertyConfig as any).extra_services.reduce((total: number, item: any) => total + (item.quantity || 1), 0)})
                        </Badge>
                      )}
                      {(propertyConfig as any).carpet_cleaning?.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {language === 'english' ? 'Carpet Cleaning' : 'Почистване на килими'} ({(propertyConfig as any).carpet_cleaning.reduce((total: number, item: any) => total + (item.quantity || 1), 0)})
                        </Badge>
                      )}
                      {(propertyConfig as any).upholstery_cleaning?.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {language === 'english' ? 'Upholstery Cleaning' : 'Почистване на тапицерия'} ({(propertyConfig as any).upholstery_cleaning.reduce((total: number, item: any) => total + (item.quantity || 1), 0)})
                        </Badge>
                      )}
                      {(propertyConfig as any).mattress_cleaning?.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {language === 'english' ? 'Mattress Cleaning' : 'Почистване на матраци'} ({(propertyConfig as any).mattress_cleaning.reduce((total: number, item: any) => total + (item.quantity || 1), 0)})
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Start Checklist Button */}
          <div className="text-center">
            <Button 
              onClick={() => setCurrentStep('checklist')}
              className="w-full py-4 text-lg font-semibold"
              size="lg"
            >
              <Play className="h-5 w-5 mr-2" />
              {language === 'english' ? 'Start Cleaning Checklist' : 'Започни чеклиста за почистване'}
            </Button>
          </div>
        </div>
      )}

      {/* Checklist Step - Room Selection */}
      {currentStep === 'checklist' && (
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-3">
            {sections.map((section) => (
              <Card 
                key={section.id} 
                className={`cursor-pointer transition-all ${section.completed ? 'border-green-500 bg-green-50' : 'hover:shadow-md'}`}
                onClick={() => {
                  setSelectedRoom(section.id);
                  setCurrentStep('room');
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        section.completed ? 'bg-green-500 text-white' : 'bg-muted'
                      }`}>
                        {section.completed ? <Check className="h-4 w-4" /> : <div className="w-3 h-3 bg-muted-foreground rounded-full" />}
                      </div>
                      <div>
                        <h3 className="font-medium">{section.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {section.tasks.filter(t => t.completed).length} / {section.tasks.length} tasks
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm font-medium">{Math.round(section.progress)}%</div>
                        <Progress value={section.progress} className="w-16 h-2" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Room Details Step */}
      {currentStep === 'room' && selectedRoom && (
        <div className="flex-1 overflow-y-auto">
          {(() => {
            const section = sections.find(s => s.id === selectedRoom);
            if (!section) return null;

            return (
              <div className="p-4 pb-20">
                {/* Room Header */}
                <div className="bg-card rounded-lg p-4 mb-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold">{section.name}</h2>
                    <Badge variant={section.completed ? "default" : "secondary"}>
                      {section.completed ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  <Progress value={section.progress} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {section.tasks.filter(t => t.completed).length} of {section.tasks.length} tasks completed
                  </p>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  {section.tasks.map((task) => (
                    <Card key={task.id} className={`${task.completed ? 'bg-green-50 border-green-200' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <button
                              onClick={() => handleTaskToggle(section.id, task.id, !task.completed)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                task.completed 
                                  ? 'bg-green-500 border-green-500 text-white' 
                                  : 'border-muted-foreground hover:border-primary'
                              }`}
                            >
                              {task.completed && <Check className="h-3 w-3" />}
                            </button>
                            <p className={`flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {task.text}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <TaskCommentDialog
                              taskName={task.text}
                              currentComment=""
                              language={language}
                              onSave={(comment) => {
                                console.log('Task comment:', comment);
                                toast({
                                  title: 'Comment saved',
                                  description: 'Task comment has been recorded',
                                });
                              }}
                            />
                            <Button variant="ghost" size="sm">
                              <Camera className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {section.note && (
                  <Card className="mt-4 bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-blue-800">{section.note}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Fixed Bottom Actions */}
      {currentStep === 'checklist' && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg">
          {overallProgress === 100 ? (
            <Button 
              onClick={handleSaveAndComplete}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving 
                ? (language === 'english' ? 'Saving...' : 'Запазване...') 
                : (language === 'english' ? 'Complete & Save Checklist' : 'Завърши и запази чеклиста')
              }
            </Button>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              {language === 'english' ? 'Complete all tasks to finish' : 'Завършете всички задачи за да приключите'}
            </div>
          )}
        </div>
      )}

    </div>
  );
}