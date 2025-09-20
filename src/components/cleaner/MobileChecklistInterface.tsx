import React, { useState, useEffect } from 'react';
import { useCleaningChecklist } from '@/hooks/useCleaningChecklist';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ModernPropertyConfigDialog } from './ModernPropertyConfigDialog';
import { TaskCommentDialog } from './TaskCommentDialog';
import { ChevronRight, ChevronDown, Check, Camera, MessageSquare, Save, ArrowLeft, Home, Settings } from 'lucide-react';
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

  const [currentStep, setCurrentStep] = useState<'overview' | 'rooms'>('overview');
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
            onClick={currentStep === 'rooms' ? () => setCurrentStep('overview') : onClose}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {currentStep === 'rooms' ? 'Back' : 'Close'}
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

      {/* Overview Step */}
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
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">
                  {language === 'english' ? 'Property Configuration' : 'Конфигурация на имота'}
                </h2>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <ModernPropertyConfigDialog
                  propertyConfig={propertyConfig}
                  language={language}
                  onSave={handlePropertyConfigSave}
                >
                  <Button variant="outline" className="h-auto py-3 px-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium">{propertyConfig?.bedrooms || 1}</div>
                      <div>Bedroom{(propertyConfig?.bedrooms || 1) > 1 ? 's' : ''}</div>
                    </div>
                  </Button>
                </ModernPropertyConfigDialog>
                
                <ModernPropertyConfigDialog
                  propertyConfig={propertyConfig}
                  language={language}
                  onSave={handlePropertyConfigSave}
                >
                  <Button variant="outline" className="h-auto py-3 px-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium">{propertyConfig?.bathrooms || 1}</div>
                      <div>Bathroom{(propertyConfig?.bathrooms || 1) > 1 ? 's' : ''}</div>
                    </div>
                  </Button>
                </ModernPropertyConfigDialog>
                
                <ModernPropertyConfigDialog
                  propertyConfig={propertyConfig}
                  language={language}
                  onSave={handlePropertyConfigSave}
                >
                  <Button variant="outline" className="h-auto py-3 px-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium">{propertyConfig?.living_rooms || 1}</div>
                      <div>Living Room{(propertyConfig?.living_rooms || 1) > 1 ? 's' : ''}</div>
                    </div>
                  </Button>
                </ModernPropertyConfigDialog>
              </div>
            </CardContent>
          </Card>

          {/* Room Sections Overview */}
          <div className="space-y-3">
            {sections.map((section) => (
              <Card 
                key={section.id} 
                className={`cursor-pointer transition-all ${section.completed ? 'border-green-500 bg-green-50' : 'hover:shadow-md'}`}
                onClick={() => {
                  setSelectedRoom(section.id);
                  setCurrentStep('rooms');
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
      {currentStep === 'rooms' && selectedRoom && (
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

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 bg-background border-t p-4">
        {currentStep === 'overview' ? (
          <div className="space-y-2">
            <Button 
              onClick={() => setCurrentStep('rooms')}
              className="w-full"
              size="lg"
            >
              {language === 'english' ? 'Start Cleaning Checklist' : 'Започни чеклиста за почистване'}
            </Button>
            {overallProgress === 100 && (
              <Button 
                onClick={handleSaveAndComplete}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {language === 'english' ? 'Complete & Save' : 'Завърши и запази'}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            {selectedRoom && (() => {
              const currentIndex = sections.findIndex(s => s.id === selectedRoom);
              const nextSection = sections[currentIndex + 1];
              const prevSection = sections[currentIndex - 1];
              
              return (
                <>
                  {prevSection && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedRoom(prevSection.id)}
                      className="flex-1"
                    >
                      Previous
                    </Button>
                  )}
                  {nextSection ? (
                    <Button 
                      onClick={() => setSelectedRoom(nextSection.id)}
                      className="flex-1"
                    >
                      Next Room
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setCurrentStep('overview')}
                      className="flex-1"
                    >
                      Overview
                    </Button>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}