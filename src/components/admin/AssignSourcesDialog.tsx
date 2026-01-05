import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users } from 'lucide-react';

interface SalesAgent {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  assigned_sources: string[] | null;
}

interface AssignSourcesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: SalesAgent | null;
  onSuccess?: () => void;
}

export const AssignSourcesDialog: React.FC<AssignSourcesDialogProps> = ({
  open,
  onOpenChange,
  agent,
  onSuccess
}) => {
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchAvailableSources();
      setSelectedSources(agent?.assigned_sources || []);
    }
  }, [open, agent]);

  const fetchAvailableSources = async () => {
    setLoading(true);
    try {
      // Get all unique sources from customers
      const { data, error } = await supabase
        .from('customers')
        .select('source')
        .not('source', 'is', null);

      if (error) throw error;

      const uniqueSources = [...new Set(data?.map(c => c.source).filter(Boolean) as string[])].sort();
      setAvailableSources(uniqueSources);
    } catch (error) {
      console.error('Error fetching sources:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch available sources',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSourceToggle = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const handleSave = async () => {
    if (!agent) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ assigned_sources: selectedSources })
        .eq('user_id', agent.user_id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Source assignments updated successfully'
      });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving sources:', error);
      toast({
        title: 'Error',
        description: 'Failed to update source assignments',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const agentName = agent 
    ? `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || agent.email || 'Sales Agent'
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Sources to {agentName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Select which customer sources this agent can access. They will see all bookings, customers, and leads from these sources.
          </p>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : availableSources.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No sources found. Add sources to customers first.
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {availableSources.map(source => (
                <div key={source} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                  <Checkbox
                    id={`source-${source}`}
                    checked={selectedSources.includes(source)}
                    onCheckedChange={() => handleSourceToggle(source)}
                  />
                  <Label 
                    htmlFor={`source-${source}`} 
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {source}
                  </Label>
                </div>
              ))}
            </div>
          )}
          
          {selectedSources.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Selected sources:</p>
              <div className="flex flex-wrap gap-1">
                {selectedSources.map(source => (
                  <Badge key={source} variant="secondary" className="text-xs">
                    {source}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Assignments
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignSourcesDialog;
