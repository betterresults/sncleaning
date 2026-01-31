import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Tag } from 'lucide-react';

interface SetCustomerSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  customerName: string;
  currentSource?: string | null;
  onSuccess?: () => void;
}

export const SetCustomerSourceDialog: React.FC<SetCustomerSourceDialogProps> = ({
  open,
  onOpenChange,
  customerId,
  customerName,
  currentSource,
  onSuccess
}) => {
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [customSource, setCustomSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchAvailableSources();
      setSelectedSource(currentSource || '');
      setCustomSource('');
    }
  }, [open, currentSource]);

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

  const handleSave = async () => {
    const sourceToSave = selectedSource === '__custom__' ? customSource.trim() : selectedSource;
    
    if (!sourceToSave) {
      toast({
        title: 'Error',
        description: 'Please select or enter a source',
        variant: 'destructive'
      });
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({ source: sourceToSave })
        .eq('id', customerId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Customer source updated successfully'
      });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving source:', error);
      toast({
        title: 'Error',
        description: 'Failed to update customer source',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearSource = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({ source: null })
        .eq('id', customerId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Customer source cleared'
      });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error clearing source:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear customer source',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Set Customer Source
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Set the source for <span className="font-medium">{customerName}</span>
          </p>
          
          {currentSource && (
            <div className="text-sm">
              <span className="text-muted-foreground">Current source: </span>
              <span className="font-medium">{currentSource}</span>
            </div>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Source</Label>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a source..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSources.map(source => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">+ Add new source...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedSource === '__custom__' && (
                <div className="space-y-2">
                  <Label>New Source Name</Label>
                  <Input
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                    placeholder="Enter source name..."
                  />
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {currentSource && (
            <Button 
              variant="outline" 
              onClick={handleClearSource} 
              disabled={saving}
              className="text-destructive hover:text-destructive"
            >
              Clear Source
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SetCustomerSourceDialog;
