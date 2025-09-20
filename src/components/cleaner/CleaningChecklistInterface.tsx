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
    parsePropertyConfig
  } = useCleaningChecklist(bookingId);

  const [customerData, setCustomerData] = useState<any>(null);
  const [cleanerData, setCleanerData] = useState<any>(null);
  const [language, setLanguage] = useState<'english' | 'bulgarian'>('english');
  const [roomSections, setRoomSections] = useState<Array<{ id: string; name: string; tasks: any[]; note?: string }>>([]);
  const [completionProgress, setCompletionProgress] = useState(0);
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
    if (!loading && !currentChecklist && bookingData && templates.length > 0) {
      // Auto-create checklist for End of Tenancy bookings
      if (bookingData.service_type === 'End of Tenancy') {
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
          name: rooms.kitchen.name[language],
          tasks: rooms.kitchen.tasks
        });
      }

      // Add living room(s)
      if (rooms.living_room && property_config.living_rooms) {
        for (let i = 1; i <= property_config.living_rooms; i++) {
          const roomId = property_config.living_rooms === 1 ? 'living_room' : `living_room_${i}`;
          const roomName = property_config.living_rooms === 1 
            ? rooms.living_room.name[language]
            : `${rooms.living_room.name[language]} ${i}`;
          
          sections.push({
            id: roomId,
            name: roomName,
            tasks: rooms.living_room.tasks
          });
        }
      }

      // Add bedroom(s)
      if (rooms.bedroom && property_config.bedrooms) {
        for (let i = 1; i <= property_config.bedrooms; i++) {
          const roomId = property_config.bedrooms === 1 ? 'bedroom' : `bedroom_${i}`;
          const roomName = property_config.bedrooms === 1 
            ? rooms.bedroom.name[language]
            : `${rooms.bedroom.name[language]} ${i}`;
          
          sections.push({
            id: roomId,
            name: roomName,
            tasks: rooms.bedroom.tasks,
            note: rooms.bedroom.note?.[language]
          });
        }
      }

      // Add bathroom(s)
      if (rooms.bathroom && property_config.bathrooms) {
        for (let i = 1; i <= property_config.bathrooms; i++) {
          const roomId = property_config.bathrooms === 1 ? 'bathroom' : `bathroom_${i}`;
          const roomName = property_config.bathrooms === 1 
            ? rooms.bathroom.name[language]
            : `${rooms.bathroom.name[language]} ${i}`;
          
          sections.push({
            id: roomId,
            name: roomName,
            tasks: rooms.bathroom.tasks
          });
        }
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
        return <Badge variant="default" className="bg-green-500"><Check className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
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

  const currentDate = new Date().toLocaleDateString();
  const customerName = customerData ? 
    `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() || customerData.email : 
    'Unknown Customer';
  const cleanerName = cleanerData?.full_name || cleanerData?.first_name || 'SN Cleaning Crew';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Cleaning Services Checklist</CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-32">
                  <Languages className="w-4 h-4 mr-2" />
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
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium">Property address</label>
              <div className="mt-1 p-2 bg-muted rounded">{bookingData?.address}, {bookingData?.postcode}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <div className="mt-1 p-2 bg-muted rounded">{currentDate}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Client</label>
              <div className="mt-1 p-2 bg-muted rounded">{customerName}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Team</label>
              <div className="mt-1 p-2 bg-muted rounded">{cleanerName}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === 'english' ? 'Completion Progress' : 'Прогрес на изпълнение'}
            </label>
            <Progress value={completionProgress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {Math.round(completionProgress)}% {language === 'english' ? 'complete' : 'завършено'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Booked Services */}
      {templates.find(t => t.id === currentChecklist.template_id)?.template_data.booked_services && (
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'english' ? 'Booked services (included)' : 'Резервирани услуги (включени)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {templates.find(t => t.id === currentChecklist.template_id)?.template_data.booked_services.map((service) => (
                <div key={service.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    ✓
                  </div>
                  <div>{service[language]}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Room Sections */}
      {roomSections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle>{section.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {section.tasks.map((task) => {
                const isCompleted = currentChecklist.checklist_data[section.id]?.[task.id] || false;
                return (
                  <div key={task.id} className="flex items-start gap-3">
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={(checked) => handleTaskToggle(section.id, task.id, !!checked)}
                      className="mt-1"
                    />
                    <div className={isCompleted ? 'line-through text-muted-foreground' : ''}>
                      {task[language]}
                    </div>
                  </div>
                );
              })}
            </div>

            {section.note && (
              <div className="pt-3 border-t border-dashed text-sm text-muted-foreground">
                {section.note}
              </div>
            )}

            <div className="pt-3 border-t">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                {language === 'english' ? 'Add Photos (1-3)' : 'Добави снимки (1-3)'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Actions */}
      {currentChecklist.status === 'completed' && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-green-600 mb-4">
              <Check className="w-12 h-12 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">
                {language === 'english' ? 'Checklist Completed!' : 'Чеклистът е завършен!'}
              </h3>
              <p className="text-muted-foreground">
                {language === 'english' 
                  ? 'All tasks have been completed successfully.' 
                  : 'Всички задачи са успешно изпълнени.'}
              </p>
            </div>
            <Button>
              {language === 'english' ? 'Generate Report' : 'Генериране на отчет'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}