import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Languages, Check, Clock } from 'lucide-react';
import { useCleaningChecklist } from '@/hooks/useCleaningChecklist';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const {
    currentChecklist,
    templates,
    loading,
    createChecklist,
    updateTaskCompletion,
    updateLanguagePreference,
    parsePropertyConfig,
    fetchChecklists
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

  // Fetch customer and cleaner data
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

  // Initialize checklist if it doesn't exist
  useEffect(() => {
    // Always fetch current checklists for this booking/cleaner first
    if (cleanerId) {
      fetchChecklists(cleanerId);
    } else {
      fetchChecklists();
    }
  }, [bookingId, cleanerId]);

  useEffect(() => {
    if (!loading && !currentChecklist && bookingData && templates.length > 0) {
      // Auto-create checklist for End of Tenancy bookings
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

  // Update language preference
  useEffect(() => {
    if (currentChecklist) {
      setLanguage(currentChecklist.language_preference);
      setPropertyConfig(currentChecklist.property_config);
    }
  }, [currentChecklist]);

  // Generate room sections based on property config and template
  useEffect(() => {
    if (currentChecklist && templates.length > 0) {
      const template = templates.find(t => t.id === currentChecklist.template_id);
      if (!template) return;

      const sections: Array<{ id: string; name: string; tasks: any[]; note?: string }> = [];
      const { property_config } = currentChecklist;
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
          const roomTemplate = rooms[roomType];
          
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
  }, [currentChecklist, templates, language]);

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
            All items have been inspected and completed unless noted below.
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
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">
              {language === 'english' ? 'Completion Progress' : 'Прогрес на изпълнение'}
            </label>
            <Progress value={completionProgress} className="w-full h-3" />
            <p className="text-sm text-muted-foreground">
              {Math.round(completionProgress)}% {language === 'english' ? 'complete' : 'завършено'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Booked Services */}
      {templates.find(t => t.id === currentChecklist.template_id)?.template_data.booked_services && (
        <Card className="border-primary/20">
          <CardHeader className="bg-primary/5 border-b border-primary/20">
            <CardTitle className="text-primary">
              {language === 'english' ? 'Booked services' : 'Резервирани услуги'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-3">
              {templates.find(t => t.id === currentChecklist.template_id)?.template_data.booked_services.map((service) => (
                <div key={service.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    ✓
                  </div>
                  <div className="font-medium">{service[langKey]}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Room Sections with Professional Layout */}
      {roomSections.map((section) => (
        <Card key={section.id} className="border-primary/20 shadow-md">
          <CardHeader className="bg-primary/5 border-b border-primary/20">
            <CardTitle className="text-primary text-xl font-bold">{section.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              {section.tasks.map((task) => {
                const isCompleted = currentChecklist.checklist_data[section.id]?.[task.id] || false;
                const taskKey = `${section.id}-${task.id}`;
                const hasComment = taskComments[taskKey];
                
                return (
                  <div key={task.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={(checked) => handleTaskToggle(section.id, task.id, !!checked)}
                        className="w-4 h-4 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm leading-relaxed ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task[langKey]}
                      </div>
                      {hasComment && (
                        <div className="mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                          {hasComment}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const comment = prompt(
                            language === 'english' 
                              ? 'Add comment for this task:' 
                              : 'Добави коментар за тази задача:', 
                            taskComments[taskKey] || ''
                          );
                          if (comment !== null) {
                            setTaskComments(prev => ({
                              ...prev,
                              [taskKey]: comment
                            }));
                          }
                        }}
                      >
                        💬
                      </Button>
                      {isCompleted && (
                        <div className="flex-shrink-0 text-primary">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {section.note && (
              <div className="mt-6 pt-4 border-t border-dashed border-primary/30">
                <div className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded-lg">
                  {section.note}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-primary/30">
              <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary">
                <Camera className="w-4 h-4 mr-2" />
                {language === 'english' ? 'Add Photos (1-3)' : 'Добави снимки (1-3)'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Property Configuration Editor */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-primary/5 border-b border-primary/20">
          <CardTitle className="text-primary">
            {language === 'english' ? 'Property Configuration' : 'Конфигурация на имота'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newCount = prompt('Bedrooms:', propertyConfig?.bedrooms?.toString() || '1');
                    if (newCount && !isNaN(parseInt(newCount))) {
                      setPropertyConfig(prev => ({ ...prev, bedrooms: parseInt(newCount) }));
                    }
                  }}
                  className="text-xs"
                >
                  {propertyConfig?.bedrooms || 1} Bedroom{(propertyConfig?.bedrooms || 1) > 1 ? 's' : ''}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newCount = prompt('Bathrooms:', propertyConfig?.bathrooms?.toString() || '1');
                    if (newCount && !isNaN(parseInt(newCount))) {
                      setPropertyConfig(prev => ({ ...prev, bathrooms: parseInt(newCount) }));
                    }
                  }}
                  className="text-xs"
                >
                  {propertyConfig?.bathrooms || 1} Bathroom{(propertyConfig?.bathrooms || 1) > 1 ? 's' : ''}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newCount = prompt('Living Rooms:', propertyConfig?.living_rooms?.toString() || '1');
                    if (newCount && !isNaN(parseInt(newCount))) {
                      setPropertyConfig(prev => ({ ...prev, living_rooms: parseInt(newCount) }));
                    }
                  }}
                  className="text-xs"
                >
                  {propertyConfig?.living_rooms || 1} Living Room{(propertyConfig?.living_rooms || 1) > 1 ? 's' : ''}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled
                >
                  1 Kitchen
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Status */}
      {currentChecklist.status === 'completed' && (
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="text-primary mb-6">
              <Check className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-2xl font-bold">
                {language === 'english' ? 'Checklist Completed!' : 'Чеклистът е завършен!'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {language === 'english' 
                  ? 'All tasks have been completed successfully.' 
                  : 'Всички задачи са успешно изпълнени.'}
              </p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg">
              {language === 'english' ? 'Generate Report' : 'Генериране на отчет'}
            </Button>
            
            <div className="mt-6 pt-6 border-t border-primary/20 text-sm text-muted-foreground">
              Photos are provided as separate attachments upon request.
            </div>
            
            <div className="mt-4 text-sm text-primary font-medium">
              SN Cleaning Services • info@sncleaningservices.co.uk • 020 3835 5033
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}