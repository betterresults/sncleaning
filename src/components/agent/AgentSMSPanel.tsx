import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  Check,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { AgentTask } from '@/hooks/useAgentTasks';

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables: unknown;
}

interface AgentSMSPanelProps {
  task: AgentTask;
}

export const AgentSMSPanel: React.FC<AgentSMSPanelProps> = ({ task }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  const [previewContent, setPreviewContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const customerPhone = task.customer?.phone;
  const customerName = task.customer?.full_name || 
    `${task.customer?.first_name || ''} ${task.customer?.last_name || ''}`.trim() ||
    'Customer';

  useEffect(() => {
    if (isOpen && templates.length === 0) {
      fetchTemplates();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedTemplate) {
      generatePreview(selectedTemplate);
    }
  }, [selectedTemplate, task]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('id, name, content, variables')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching SMS templates:', err);
      toast({
        title: 'Error',
        description: 'Failed to load SMS templates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = (template: SMSTemplate) => {
    let content = template.content;
    
    // Replace common variables with actual data
    const replacements: Record<string, string> = {
      '{{customer_name}}': customerName,
      '{{first_name}}': task.customer?.first_name || 'Customer',
      '{{last_name}}': task.customer?.last_name || '',
      '{{booking_id}}': task.booking_id?.toString() || '',
      '{{booking_date}}': task.booking?.date_only 
        ? format(new Date(task.booking.date_only), 'EEEE, dd MMMM yyyy')
        : '',
      '{{address}}': task.booking?.address || '',
      '{{postcode}}': task.booking?.postcode || '',
      '{{service_type}}': task.booking?.service_type || 'Cleaning',
    };

    Object.entries(replacements).forEach(([key, value]) => {
      content = content.replace(new RegExp(key, 'g'), value);
    });

    setPreviewContent(content);
  };

  const handleSendSMS = async () => {
    if (!customerPhone) {
      toast({
        title: 'No phone number',
        description: 'This customer does not have a phone number on file.',
        variant: 'destructive'
      });
      return;
    }

    if (!previewContent) {
      toast({
        title: 'No message',
        description: 'Please select a template first.',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-sms-notification', {
        body: {
          to: customerPhone,
          message: previewContent
        }
      });

      if (error) throw error;

      toast({
        title: 'SMS Sent',
        description: `Message sent to ${customerName}`,
      });
      
      // Reset state
      setSelectedTemplate(null);
      setPreviewContent('');
      setIsOpen(false);
    } catch (err) {
      console.error('Error sending SMS:', err);
      toast({
        title: 'Error',
        description: 'Failed to send SMS. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  if (!task.customer) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Send SMS</span>
            {customerPhone && (
              <Badge variant="secondary" className="text-xs">
                {customerPhone}
              </Badge>
            )}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-2" onClick={(e) => e.stopPropagation()}>
        <div className="border rounded-lg p-4 bg-background space-y-4">

          {/* Template Selection */}
          <div>
            <p className="text-sm font-medium mb-2">Select Template</p>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[150px]">
                <div className="space-y-1">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`w-full text-left p-2 rounded-md transition-colors text-sm ${
                        selectedTemplate?.id === template.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{template.name}</span>
                        {selectedTemplate?.id === template.id && (
                          <Check className="h-4 w-4" />
                        )}
                      </div>
                    </button>
                  ))}
                  {templates.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No SMS templates available
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Preview */}
          {selectedTemplate && (
            <div>
              <p className="text-sm font-medium mb-2">Message Preview</p>
              <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                {previewContent}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {previewContent.length} characters
              </p>
            </div>
          )}

          {/* Send Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTemplate(null);
                setPreviewContent('');
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSendSMS}
              disabled={!selectedTemplate || !customerPhone || sending}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send SMS
                </>
              )}
            </Button>
          </div>

          {!customerPhone && (
            <p className="text-xs text-destructive">
              This customer doesn't have a phone number on file.
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
