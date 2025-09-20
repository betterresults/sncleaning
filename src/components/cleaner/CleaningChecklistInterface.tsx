import React, { useState, useEffect } from 'react';
import { MobileChecklistInterface } from './MobileChecklistInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Languages, Check, Clock, Smartphone, Globe } from 'lucide-react';
import { useCleaningChecklist } from '@/hooks/useCleaningChecklist';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TaskCommentDialog } from './TaskCommentDialog';
import { ModernPropertyConfigDialog } from './ModernPropertyConfigDialog';

interface CleaningChecklistInterfaceProps {
  bookingId: number;
  cleanerId: number;
  bookingData?: {
    address: string;
    postcode: string;
    customer: number;
    date_time: string;
    service_type: string;
    cleaning_type?: string;
    property_details?: string;
  };
}

export function CleaningChecklistInterface({ 
  bookingId, 
  cleanerId, 
  bookingData 
}: CleaningChecklistInterfaceProps) {
  const [showMobileInterface, setShowMobileInterface] = useState(false);
  const {
    currentChecklist,
    templates,
    loading,
    createChecklist,
    updateTaskCompletion,
    updateLanguagePreference,
    parsePropertyConfig,
    fetchChecklists,
    updatePropertyConfig
  } = useCleaningChecklist(bookingId);

  const [customerData, setCustomerData] = useState<any>(null);
  const [cleanerData, setCleanerData] = useState<any>(null);
  const [language, setLanguage] = useState<'english' | 'bulgarian'>('english');
  const langKey = language === 'english' ? 'en' : 'bg';
  const [roomSections, setRoomSections] = useState<Array<{ id: string; name: string; tasks: any[]; note?: string }>>([]);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [taskComments, setTaskComments] = useState<Record<string, string>>({});
  const [propertyType, setPropertyType] = useState('Flat');
  const [propertyConfig, setPropertyConfig] = useState<any>(null);
  const { toast } = useToast();

  // useEffect hooks for data fetching and processing
  useEffect(() => {
    const fetchAdditionalData = async () => {
      try {
        if (bookingData?.customer) {
          const { data: customer } = await supabase
            .from('customers')
            .select('first_name, last_name, email')
            .eq('id', bookingData.customer)
            .single();
          
          setCustomerData(customer);
        }

        const { data: cleaner } = await supabase
          .from('cleaners')
          .select('first_name, last_name, full_name')
          .eq('id', cleanerId)
          .single();
        
        setCleanerData(cleaner);
      } catch (error) {
        console.error('Error fetching additional data:', error);
      }
    };

    fetchAdditionalData();
  }, [bookingData?.customer, cleanerId]);

  useEffect(() => {
    if (cleanerId) {
      fetchChecklists(cleanerId);
    } else {
      fetchChecklists();
    }
  }, [bookingId, cleanerId]);

  useEffect(() => {
    if (!loading && !currentChecklist && bookingData && templates.length > 0) {
      const isEoT = bookingData.service_type === 'End of Tenancy' || bookingData.cleaning_type === 'End of Tenancy';
      if (isEoT) {
        const template = templates.find(t => t.service_type === 'End of Tenancy');
        if (template) {
          const propertyConfig = parsePropertyConfig(bookingData.property_details);
          createChecklist(bookingId, cleanerId, template.id, propertyConfig);
        }
      }
    }
  }, [loading, currentChecklist, bookingData, templates, bookingId, cleanerId]);

  useEffect(() => {
    if (currentChecklist) {
      setLanguage(currentChecklist.language_preference);
      setPropertyConfig(currentChecklist.property_config);
    }
  }, [currentChecklist]);

  // room sections generation logic
  useEffect(() => {
    if (currentChecklist && templates.length > 0) {
      const template = templates.find(t => t.id === currentChecklist.template_id);
      if (!template) return;

      const sections: Array<{ id: string; name: string; tasks: any[]; note?: string }> = [];
      const property_config = propertyConfig || currentChecklist.property_config;
      const { rooms } = template.template_data;

      // Add kitchen (always single)
      if (rooms.kitchen) {
        sections.push({
          id: 'kitchen',
          name: rooms.kitchen.name[langKey],
          tasks: rooms.kitchen.tasks,
          note: rooms.kitchen.note?.[langKey]
        });
      }

      // Add living room(s) - now properly supported in template
      if (rooms.living_room && property_config.living_rooms) {
        for (let i = 1; i <= property_config.living_rooms; i++) {
          const roomId = property_config.living_rooms === 1 ? 'living_room' : `living_room_${i}`;
          const roomName = property_config.living_rooms === 1 
            ? rooms.living_room.name[langKey]
            : `${rooms.living_room.name[langKey]} ${i}`;
          
          sections.push({
            id: roomId,
            name: roomName,
            tasks: rooms.living_room.tasks,
            note: rooms.living_room.note?.[langKey]
          });
        }
      }

      // Add bedroom(s)
      if (rooms.bedroom && property_config.bedrooms) {
        for (let i = 1; i <= property_config.bedrooms; i++) {
          const roomId = property_config.bedrooms === 1 ? 'bedroom' : `bedroom_${i}`;
          const roomName = property_config.bedrooms === 1 
            ? rooms.bedroom.name[langKey]
            : `${rooms.bedroom.name[langKey]} ${i}`;
          
          sections.push({
            id: roomId,
            name: roomName,
            tasks: rooms.bedroom.tasks,
            note: rooms.bedroom.note?.[langKey]
          });
        }
      }

      // Add bathroom(s)
      if (rooms.bathroom && property_config.bathrooms) {
        for (let i = 1; i <= property_config.bathrooms; i++) {
          const roomId = property_config.bathrooms === 1 ? 'bathroom' : `bathroom_${i}`;
          const roomName = property_config.bathrooms === 1 
            ? rooms.bathroom.name[langKey]
            : `${rooms.bathroom.name[langKey]} ${i}`;
          
          sections.push({
            id: roomId,
            name: roomName,
            tasks: rooms.bathroom.tasks,
            note: rooms.bathroom.note?.[langKey]
          });
        }
      }

      // Add additional rooms from property config
      if (property_config.additional_rooms?.length) {
        property_config.additional_rooms.forEach((additionalRoom) => {
          const roomType = additionalRoom.type;
          let roomTemplate = rooms[roomType];
          
          // Handle room types that might not have direct templates
          if (!roomTemplate) {
            // Map additional room types to available templates or create basic structure
            switch (roomType) {
              case 'guest_bedroom':
                roomTemplate = rooms.bedroom; // Use bedroom template
                break;
              case 'wc':
              case 'ensuite':
                roomTemplate = rooms.bathroom; // Use bathroom template
                break;
              case 'dining_room':
              case 'utility_room':
              case 'study_room':
              case 'conservatory':
              case 'balcony':
                roomTemplate = rooms[roomType] || {
                  name: { 
                    en: roomType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    bg: roomType.replace('_', ' ')
                  },
                  tasks: [
                    {
                      id: `${roomType}_basic_clean`,
                      en: 'Clean and tidy',
                      bg: 'Почистване и подреждане'
                    }
                  ]
                };
                break;
            }
          }
          
          if (roomTemplate) {
            for (let i = 1; i <= additionalRoom.count; i++) {
              const roomId = additionalRoom.count === 1 ? roomType : `${roomType}_${i}`;
              const roomName = additionalRoom.count === 1 
                ? roomTemplate.name[langKey]
                : `${roomTemplate.name[langKey]} ${i}`;
              
              sections.push({
                id: roomId,
                name: roomName,
                tasks: roomTemplate.tasks,
                note: roomTemplate.note?.[langKey]
              });
            }
          }
        });
      }

      setRoomSections(sections);

      // Calculate completion progress
      const totalTasks = sections.reduce((total, section) => total + section.tasks.length, 0);
      const completedTasks = sections.reduce((completed, section) => {
        const roomData = currentChecklist.checklist_data[section.id] || {};
        return completed + section.tasks.filter(task => roomData[task.id]).length;
      }, 0);

      setCompletionProgress(totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0);
    }
  }, [currentChecklist, templates, language, propertyConfig]);

  const handleLanguageChange = (newLanguage: 'english' | 'bulgarian') => {
    setLanguage(newLanguage);
    if (currentChecklist) {
      updateLanguagePreference(currentChecklist.id, newLanguage);
    }
  };

  const handleTaskToggle = (roomId: string, taskId: string, completed: boolean) => {
    if (currentChecklist) {
      updateTaskCompletion(currentChecklist.id, roomId, taskId, completed);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-primary text-primary-foreground"><Check className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-primary/20 text-primary"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="outline" className="border-primary/30 text-primary">Not Started</Badge>;
    }
  };

  if (showMobileInterface) {
    return (
      <MobileChecklistInterface 
        bookingId={bookingId} 
        onClose={() => setShowMobileInterface(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading checklist...</p>
        </div>
      </div>
    );
  }

  if (!currentChecklist) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>No checklist available for this booking.</p>
          <p className="text-muted-foreground text-sm mt-2">
            Checklists are automatically created for End of Tenancy bookings.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentDate = new Date(bookingData?.date_time || new Date()).toLocaleDateString();
  const customerName = customerData ? 
    `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() || customerData.email : 
    'Unknown Customer';
  const cleanerName = cleanerData?.full_name || cleanerData?.first_name || 'SN Cleaning Crew';

  return (
    <div className="space-y-6 bg-background">
      {/* Header with SN Cleaning Brand Styling */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-primary font-bold">SN Cleaning Services</CardTitle>
              <p className="text-primary/70 text-sm mt-1">Cleaning Services Checklist</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowMobileInterface(true)}
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                Mobile View
              </Button>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-32 border-primary/30">
                  <Languages className="w-4 h-4 mr-2 text-primary" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="bulgarian">Български</SelectItem>
                </SelectContent>
              </Select>
              {getStatusBadge(currentChecklist.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground mb-4">
            End of Tenancy Cleaning
          </div>
          
          {/* Mobile Interface Prompt */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Mobile-Optimized Experience Available</p>
                <p className="text-xs text-blue-700 mt-1">
                  Switch to mobile view for a step-by-step interface designed for cleaning on-the-go
                </p>
              </div>
              <Button
                onClick={() => setShowMobileInterface(true)}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Try Mobile View
              </Button>
            </div>
          </div>

          {/* Basic Property Information */}
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-primary mb-3">Property Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Property address</label>
                <div className="mt-1 font-medium">{bookingData?.address}, {bookingData?.postcode}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date</label>
                <div className="mt-1 font-medium">{currentDate}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Client</label>
                <div className="mt-1 font-medium">{customerName}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Team</label>
                <div className="mt-1 font-medium">{cleanerName}</div>
              </div>
            </div>
          </div>

          {/* Property Configuration */}
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-primary mb-3">
              {language === 'english' ? 'Property Configuration' : 'Конфигурация на имота'}
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {language === 'english' ? 'Property Type' : 'Тип имот'}
                </label>
                <div className="flex gap-2">
                  {['Flat', 'House', 'Townhouse'].map((type) => (
                    <Button
                      key={type}
                      variant={propertyType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPropertyType(type)}
                      className="text-xs"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {language === 'english' ? 'Configuration' : 'Конфигурация'}
                </label>
                <div className="flex flex-wrap gap-2">
                  <ModernPropertyConfigDialog
                    propertyConfig={propertyConfig}
                    language={language}
                    onSave={(config) => { setPropertyConfig(config); if (currentChecklist) { updatePropertyConfig(currentChecklist.id, config); } }}
                  >
                    <Button variant="outline" size="sm" className="text-xs hover:bg-primary/10 hover:border-primary/50">
                      {propertyConfig?.bedrooms || 1} Bedroom{(propertyConfig?.bedrooms || 1) > 1 ? 's' : ''}
                    </Button>
                  </ModernPropertyConfigDialog>
                  
                  <ModernPropertyConfigDialog
                    propertyConfig={propertyConfig}
                    language={language}
                    onSave={(config) => { setPropertyConfig(config); if (currentChecklist) { updatePropertyConfig(currentChecklist.id, config); } }}
                  >
                    <Button variant="outline" size="sm" className="text-xs hover:bg-primary/10 hover:border-primary/50">
                      {propertyConfig?.bathrooms || 1} Bathroom{(propertyConfig?.bathrooms || 1) > 1 ? 's' : ''}
                    </Button>
                  </ModernPropertyConfigDialog>
                  
                  <ModernPropertyConfigDialog
                    propertyConfig={propertyConfig}
                    language={language}
                    onSave={(config) => { setPropertyConfig(config); if (currentChecklist) { updatePropertyConfig(currentChecklist.id, config); } }}
                  >
                    <Button variant="outline" size="sm" className="text-xs hover:bg-primary/10 hover:border-primary/50">
                      {propertyConfig?.living_rooms || 1} Living Room{(propertyConfig?.living_rooms || 1) > 1 ? 's' : ''}
                    </Button>
                  </ModernPropertyConfigDialog>
                  
                  {/* Show additional rooms if any */}
                  {propertyConfig?.additional_rooms?.map((room, index) => (
                    <Badge key={`${room.type}-${index}`} variant="secondary" className="text-xs">
                      {room.count} {room.type.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-primary">
                {language === 'english' ? 'Overall Progress' : 'Общ напредък'}
              </span>
              <span className="text-muted-foreground">{Math.round(completionProgress)}%</span>
            </div>
            <Progress value={completionProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Desktop Interface Message */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Smartphone className="h-8 w-8 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-800">
                {language === 'english' ? 'Mobile Interface Recommended' : 'Препоръчва се мобилен интерфейс'}
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                {language === 'english' 
                  ? 'For the best cleaning experience, please use the mobile interface above. It\'s specifically designed for cleaners working on mobile devices with step-by-step guidance, room-by-room navigation, and auto-save functionality.'
                  : 'За най-добро изживяване при почистване, моля използвайте мобилния интерфейс отгоре. Той е специално проектиран за почистващи, работещи на мобилни устройства със стъпка по стъпка ръководство, навигация стая по стая и функция за автоматично запазване.'
                }
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => setShowMobileInterface(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg"
          >
            <Smartphone className="h-5 w-5 mr-2" />
            {language === 'english' ? 'Launch Mobile Interface' : 'Стартирай мобилния интерфейс'}
          </Button>
          
          <div className="mt-6 pt-6 border-t border-amber-200 text-sm text-amber-700">
            {language === 'english' 
              ? 'The mobile interface includes automatic saving, progress tracking, and is optimized for touch interaction.'
              : 'Мобилният интерфейс включва автоматично запазване, проследяване на напредъка и е оптимизиран за сензорно взаимодействие.'
            }
          </div>
          
          <div className="mt-4 text-sm text-primary font-medium">
            SN Cleaning Services • info@sncleaningservices.co.uk • 020 3835 5033
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
