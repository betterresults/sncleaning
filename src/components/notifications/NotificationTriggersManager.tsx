import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Clock, Users } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
}

interface NotificationTrigger {
  id: string;
  name: string;
  trigger_event: string;
  template_id: string;
  is_enabled: boolean;
  timing_offset: number;
  timing_unit: string;
  recipient_types: string[];
  conditions: any; // Json type from Supabase
  created_at: string;
  updated_at: string;
  email_notification_templates?: EmailTemplate;
}

const TRIGGER_EVENTS = [
  { value: 'booking_created', label: 'Booking Created' },
  { value: 'booking_completed', label: 'Booking Completed' },
  { value: 'booking_cancelled', label: 'Booking Cancelled' },
  { value: 'photos_uploaded', label: 'Photos Uploaded' },
  { value: 'payment_received', label: 'Payment Received' },
  { value: 'payment_failed', label: 'Payment Failed' },
  { value: 'booking_reminder', label: 'Booking Reminder' },
  { value: 'customer_created', label: 'Customer Created' },
  { value: 'cleaner_assigned', label: 'Cleaner Assigned' },
];

const RECIPIENT_TYPES = [
  { value: 'customer', label: 'Customer' },
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'admin', label: 'Admin' },
];

const TIMING_UNITS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
];

export const NotificationTriggersManager = () => {
  const [triggers, setTriggers] = useState<NotificationTrigger[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTrigger, setEditingTrigger] = useState<NotificationTrigger | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [triggersResult, templatesResult] = await Promise.all([
        supabase
          .from('notification_triggers')
          .select(`
            *,
            email_notification_templates (
              id,
              name,
              subject
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('email_notification_templates')
          .select('id, name, subject')
          .eq('is_active', true)
          .order('name', { ascending: true })
      ]);

      if (triggersResult.error) throw triggersResult.error;
      if (templatesResult.error) throw templatesResult.error;

      setTriggers(triggersResult.data || []);
      setTemplates(templatesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notification triggers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTrigger = async (triggerData: Partial<NotificationTrigger>) => {
    try {
      if (editingTrigger) {
        const { error } = await supabase
          .from('notification_triggers')
          .update(triggerData)
          .eq('id', editingTrigger.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Trigger updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('notification_triggers')
          .insert(triggerData as any);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Trigger created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingTrigger(null);
      fetchData();
    } catch (error) {
      console.error('Error saving trigger:', error);
      toast({
        title: "Error",
        description: "Failed to save trigger",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTrigger = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trigger?')) return;

    try {
      const { error } = await supabase
        .from('notification_triggers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Trigger deleted successfully",
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting trigger:', error);
      toast({
        title: "Error",
        description: "Failed to delete trigger",
        variant: "destructive",
      });
    }
  };

  const toggleTriggerEnabled = async (id: string, is_enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('notification_triggers')
        .update({ is_enabled })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating trigger status:', error);
      toast({
        title: "Error",
        description: "Failed to update trigger status",
        variant: "destructive",
      });
    }
  };

  const getTimingDescription = (trigger: NotificationTrigger) => {
    if (trigger.timing_offset === 0) {
      return "Immediately";
    }
    const isAfter = trigger.timing_offset > 0;
    const absOffset = Math.abs(trigger.timing_offset);
    return `${absOffset} ${trigger.timing_unit} ${isAfter ? 'after' : 'before'}`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading triggers...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Notification Triggers ({triggers.length})</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTrigger(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Trigger
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTrigger ? 'Edit Trigger' : 'Create New Trigger'}
              </DialogTitle>
              <DialogDescription>
                Configure when and how notifications are triggered
              </DialogDescription>
            </DialogHeader>
            <TriggerEditor
              trigger={editingTrigger}
              templates={templates}
              onSave={handleSaveTrigger}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingTrigger(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {triggers.map((trigger) => (
          <Card key={trigger.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {trigger.name}
                    {!trigger.is_enabled && (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {TRIGGER_EVENTS.find(e => e.value === trigger.trigger_event)?.label || trigger.trigger_event}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={trigger.is_enabled}
                    onCheckedChange={(checked) => toggleTriggerEnabled(trigger.id, checked)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingTrigger(trigger);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTrigger(trigger.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{getTimingDescription(trigger)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex gap-1">
                    {trigger.recipient_types.map((type) => (
                      <Badge key={type} variant="outline">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Template: {trigger.email_notification_templates?.name || 'Unknown'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

interface TriggerEditorProps {
  trigger: NotificationTrigger | null;
  templates: EmailTemplate[];
  onSave: (data: Partial<NotificationTrigger>) => void;
  onCancel: () => void;
}

const TriggerEditor: React.FC<TriggerEditorProps> = ({
  trigger,
  templates,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: trigger?.name || '',
    trigger_event: trigger?.trigger_event || '',
    template_id: trigger?.template_id || '',
    is_enabled: trigger?.is_enabled ?? true,
    timing_offset: trigger?.timing_offset || 0,
    timing_unit: trigger?.timing_unit || 'minutes',
    recipient_types: trigger?.recipient_types || ['customer'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleRecipientTypeChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      recipient_types: checked
        ? [...prev.recipient_types, type]
        : prev.recipient_types.filter(t => t !== type)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Trigger Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_enabled"
            checked={formData.is_enabled}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_enabled: checked }))}
          />
          <Label htmlFor="is_enabled">Enabled</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="trigger_event">Trigger Event</Label>
        <Select
          value={formData.trigger_event}
          onValueChange={(value) => setFormData(prev => ({ ...prev, trigger_event: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an event" />
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_EVENTS.map((event) => (
              <SelectItem key={event.value} value={event.value}>
                {event.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="template_id">Email Template</Label>
        <Select
          value={formData.template_id}
          onValueChange={(value) => setFormData(prev => ({ ...prev, template_id: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="timing_offset">Timing Offset</Label>
          <Input
            id="timing_offset"
            type="number"
            value={formData.timing_offset}
            onChange={(e) => setFormData(prev => ({ ...prev, timing_offset: parseInt(e.target.value) || 0 }))}
            placeholder="0 for immediate"
          />
        </div>
        <div>
          <Label htmlFor="timing_unit">Timing Unit</Label>
          <Select
            value={formData.timing_unit}
            onValueChange={(value) => setFormData(prev => ({ ...prev, timing_unit: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMING_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Recipients</Label>
        <div className="space-y-2 mt-2">
          {RECIPIENT_TYPES.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={type.value}
                checked={formData.recipient_types.includes(type.value)}
                onCheckedChange={(checked) => handleRecipientTypeChange(type.value, checked as boolean)}
              />
              <Label htmlFor={type.value}>{type.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {trigger ? 'Update' : 'Create'} Trigger
        </Button>
      </div>
    </form>
  );
};