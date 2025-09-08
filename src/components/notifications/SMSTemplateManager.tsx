import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Eye,
  EyeOff,
  Copy,
  CheckCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SMSTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SMSTemplateManager = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    is_active: true
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cast variables from Json to string[]
      const templatesWithTypedVariables = (data || []).map(template => ({
        ...template,
        variables: Array.isArray(template.variables) ? template.variables as string[] : []
      }));
      
      setTemplates(templatesWithTypedVariables);
    } catch (error) {
      console.error('Error loading SMS templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load SMS templates',
        variant: 'destructive'
      });
    }
  };

  const extractVariables = (content: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = [];
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      const variable = match[1].trim();
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }
    
    return variables;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      content: '',
      is_active: true
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: SMSTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      content: template.content,
      is_active: template.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast({
        title: 'Error',
        description: 'Template name and content are required',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const variables = extractVariables(formData.content);
      
      const templateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        content: formData.content.trim(),
        variables: variables,
        is_active: formData.is_active
      };

      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('sms_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'SMS template updated successfully'
        });
      } else {
        // Create new template
        const { error } = await supabase
          .from('sms_templates')
          .insert([templateData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'SMS template created successfully'
        });
      }

      await loadTemplates();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving SMS template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save SMS template',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('sms_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      await loadTemplates();
      toast({
        title: 'Success',
        description: 'SMS template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting SMS template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete SMS template',
        variant: 'destructive'
      });
    }
  };

  const toggleTemplateStatus = async (template: SMSTemplate) => {
    try {
      const { error } = await supabase
        .from('sms_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;

      await loadTemplates();
      toast({
        title: 'Success',
        description: `Template ${!template.is_active ? 'activated' : 'deactivated'}`
      });
    } catch (error) {
      console.error('Error updating template status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template status',
        variant: 'destructive'
      });
    }
  };

  const copyTemplate = (template: SMSTemplate) => {
    navigator.clipboard.writeText(template.content);
    toast({
      title: 'Copied',
      description: 'Template content copied to clipboard'
    });
  };

  const filteredTemplates = showInactive 
    ? templates 
    : templates.filter(t => t.is_active);

  const previewTemplate = (content: string, variables: string[]): string => {
    let preview = content;
    variables.forEach(variable => {
      const sampleValue = getSampleValue(variable);
      preview = preview.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), sampleValue);
    });
    return preview;
  };

  const getSampleValue = (variable: string): string => {
    const samples: { [key: string]: string } = {
      'customer_name': 'John Smith',
      'booking_date': '15th December 2024',
      'booking_time': '10:00 AM',
      'address': '123 Main Street, London',
      'cleaner_name': 'Sarah Johnson',
      'amount': '75.00',
      'photo_link': 'https://example.com/photos'
    };
    return samples[variable] || `[${variable}]`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Templates ({filteredTemplates.length})
          </h2>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label className="text-sm">Show inactive</Label>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit SMS Template' : 'Create SMS Template'}
              </DialogTitle>
              <DialogDescription>
                Create reusable SMS templates with dynamic variables using {"{{variable_name}}"} syntax
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="e.g., Booking Confirmation"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="flex items-center gap-2 pt-8">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-description">Description (optional)</Label>
                <Input
                  id="template-description"
                  placeholder="Brief description of when this template is used"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-content">SMS Content</Label>
                <Textarea
                  id="template-content"
                  placeholder="Hi {{customer_name}}! Your booking is confirmed for {{booking_date}}..."
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                />
                <div className="text-sm text-muted-foreground">
                  Use {"{{variable_name}}"} for dynamic content. Character count: {formData.content.length}/160
                </div>
              </div>

              {formData.content && (
                <div className="space-y-2">
                  <Label>Variables Found</Label>
                  <div className="flex flex-wrap gap-1">
                    {extractVariables(formData.content).map(variable => (
                      <Badge key={variable} variant="secondary">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.content && extractVariables(formData.content).length > 0 && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {previewTemplate(formData.content, extractVariables(formData.content))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className={!template.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {template.is_active ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {template.variables.length} variable{template.variables.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyTemplate(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleTemplateStatus(template)}
                  >
                    {template.is_active ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete SMS Template</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{template.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(template.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              
              {template.description && (
                <p className="text-sm text-muted-foreground">{template.description}</p>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Template Content:</p>
                  <p className="text-sm">{template.content}</p>
                </div>
                
                {template.variables.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map(variable => (
                        <Badge key={variable} variant="secondary">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {template.variables.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    <div className="p-3 bg-blue-50 rounded-lg text-sm">
                      {previewTemplate(template.content, template.variables)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              {showInactive ? 'No SMS templates found' : 'No active SMS templates found'}
            </p>
            <Button onClick={resetForm} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SMSTemplateManager;