import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChecklistTemplate {
  id: string;
  name: string;
  service_type: string;
  template_data: {
    booked_services: Array<{
      id: string;
      en: string;
      bg: string;
    }>;
    rooms: {
      [key: string]: {
        name: { en: string; bg: string };
        tasks: Array<{
          id: string;
          en: string;
          bg: string;
        }>;
        note?: { en: string; bg: string };
      };
    };
  };
  is_active: boolean;
}

interface Checklist {
  id: string;
  booking_id: number;
  cleaner_id: number;
  template_id: string;
  property_config: {
    bedrooms: number;
    bathrooms: number;
    living_rooms: number;
    additional_rooms?: Array<{ type: string; count: number }>;
  };
  checklist_data: {
    [roomId: string]: {
      [taskId: string]: boolean;
    };
  };
  photos: Array<{
    room_section: string;
    file_path: string;
    caption?: string;
  }>;
  status: 'not_started' | 'in_progress' | 'completed';
  language_preference: 'english' | 'bulgarian';
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface PropertyConfig {
  bedrooms: number;
  bathrooms: number;
  living_rooms: number;
  additional_rooms?: Array<{ type: string; count: number }>;
}

export function useCleaningChecklist(bookingId?: number) {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [currentChecklist, setCurrentChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Fetch checklist templates
  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaning_checklist_templates')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setTemplates((data || []) as unknown as ChecklistTemplate[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch checklist templates",
        variant: "destructive",
      });
    }
  };

  // Fetch checklists for current cleaner
  const fetchChecklists = async (cleanerId?: number) => {
    try {
      let query = supabase
        .from('cleaning_checklists')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingId) {
        query = query.eq('booking_id', bookingId);
      }

      if (cleanerId) {
        query = query.eq('cleaner_id', cleanerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setChecklists((data || []) as Checklist[]);
      
      if (bookingId && data && data.length > 0) {
        setCurrentChecklist(data[0] as Checklist);
      }
    } catch (error) {
      console.error('Error fetching checklists:', error);
      toast({
        title: "Error",
        description: "Failed to fetch checklists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Parse property details from booking
  const parsePropertyConfig = (propertyDetails?: string): PropertyConfig => {
    const defaultConfig = {
      bedrooms: 1,
      bathrooms: 1,
      living_rooms: 1,
    };

    if (!propertyDetails) return defaultConfig;

    try {
      const config = { ...defaultConfig };
      const details = propertyDetails.toLowerCase();

      // Extract bedroom count
      const bedroomMatch = details.match(/(\d+)\s*bed/);
      if (bedroomMatch) {
        config.bedrooms = parseInt(bedroomMatch[1]);
      }

      // Extract bathroom count
      const bathroomMatch = details.match(/(\d+)\s*bath/);
      if (bathroomMatch) {
        config.bathrooms = parseInt(bathroomMatch[1]);
      }

      return config;
    } catch (error) {
      console.error('Error parsing property config:', error);
      return defaultConfig;
    }
  };

  // Create new checklist for booking
  const createChecklist = async (
    bookingId: number,
    cleanerId: number,
    templateId: string,
    propertyConfig: PropertyConfig,
    languagePreference: 'english' | 'bulgarian' = 'english'
  ) => {
    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('cleaning_checklists')
        .insert({
          booking_id: bookingId,
          cleaner_id: cleanerId,
          template_id: templateId,
          property_config: propertyConfig as any,
          language_preference: languagePreference,
          status: 'not_started'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentChecklist(data as Checklist);
      toast({
        title: "Success",
        description: "Checklist created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating checklist:', error);
      toast({
        title: "Error",
        description: "Failed to create checklist",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Update checklist task completion
  const updateTaskCompletion = async (
    checklistId: string,
    roomId: string,
    taskId: string,
    completed: boolean
  ) => {
    try {
      if (!currentChecklist) return;

      const updatedChecklistData = {
        ...currentChecklist.checklist_data,
        [roomId]: {
          ...currentChecklist.checklist_data[roomId],
          [taskId]: completed
        }
      };

      // Calculate completion status
      const totalTasks = Object.values(updatedChecklistData).reduce(
        (total, roomTasks) => total + Object.keys(roomTasks).length,
        0
      );
      const completedTasks = Object.values(updatedChecklistData).reduce(
        (completed, roomTasks) => completed + Object.values(roomTasks).filter(Boolean).length,
        0
      );

      const newStatus = completedTasks === 0 ? 'not_started' : 
                      completedTasks === totalTasks ? 'completed' : 'in_progress';

      const updateData: any = {
        checklist_data: updatedChecklistData,
        status: newStatus
      };

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('cleaning_checklists')
        .update(updateData)
        .eq('id', checklistId);

      if (error) throw error;

      // Update local state
      setCurrentChecklist({
        ...currentChecklist,
        checklist_data: updatedChecklistData,
        status: newStatus,
        ...(newStatus === 'completed' && { completed_at: updateData.completed_at })
      });

    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  // Update language preference
  const updateLanguagePreference = async (
    checklistId: string,
    language: 'english' | 'bulgarian'
  ) => {
    try {
      const { error } = await supabase
        .from('cleaning_checklists')
        .update({ language_preference: language })
        .eq('id', checklistId);

      if (error) throw error;

      if (currentChecklist) {
        setCurrentChecklist({
          ...currentChecklist,
          language_preference: language
        });
      }
    } catch (error) {
      console.error('Error updating language:', error);
      toast({
        title: "Error",
        description: "Failed to update language preference",
        variant: "destructive",
      });
    }
  };

  // Upload photo for checklist room
  const uploadPhoto = async (
    checklistId: string,
    roomSection: string,
    file: File,
    caption?: string
  ) => {
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${checklistId}/${roomSection}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('cleaning-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save photo record
      const { error: dbError } = await supabase
        .from('cleaning_checklist_photos')
        .insert({
          checklist_id: checklistId,
          room_section: roomSection,
          file_path: fileName,
          caption: caption
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      });

    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    checklists,
    templates,
    currentChecklist,
    loading,
    saving,
    fetchChecklists,
    createChecklist,
    updateTaskCompletion,
    updateLanguagePreference,
    uploadPhoto,
    parsePropertyConfig
  };
}