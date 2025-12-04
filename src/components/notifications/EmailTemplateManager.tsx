import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Eye, Trash2, Send, Mail } from "lucide-react";
import { VariablePicker, getVariableExample } from "./VariablePicker";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables: any; // Json type from Supabase
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const EmailTemplateManager = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<EmailTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_notification_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []).map(template => ({
        ...template,
        variables: Array.isArray(template.variables) ? template.variables : []
      })));
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch email templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (templateData: Partial<EmailTemplate>) => {
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('email_notification_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Template updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('email_notification_templates')
          .insert(templateData as any);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Template created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('email_notification_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const toggleTemplateActive = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from('email_notification_templates')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template status:', error);
      toast({
        title: "Error",
        description: "Failed to update template status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Email Templates ({templates.length})</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTemplate(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
              <DialogDescription>
                Create reusable email templates with dynamic variables
              </DialogDescription>
            </DialogHeader>
            <EmailTemplateEditor
              template={editingTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingTemplate(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    {!template.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={template.is_active}
                    onCheckedChange={(checked) => toggleTemplateActive(template.id, checked)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreviewingTemplate(template);
                      setIsPreviewOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingTemplate(template);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Subject:</strong> {template.subject}</p>
                <div>
                  <strong>Variables:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="outline">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(template.updated_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Email Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Preview - {previewingTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Preview how this email template will look with sample data
            </DialogDescription>
          </DialogHeader>
          {previewingTemplate && (
            <EmailPreview template={previewingTemplate} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface EmailPreviewProps {
  template: EmailTemplate;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({ template }) => {
  const [sampleData, setSampleData] = useState<Record<string, string>>({
    customer_name: 'John Smith',
    booking_date: 'Friday, 12 September 2025',
    booking_time: '10:00 AM',
    service_type: 'Domestic Cleaning',
    address: '123 Main Street, London',
    total_cost: '£150.00',
    cleaner_name: 'Maria Garcia',
    temp_password: 'TempPass123!',
  });

  const replaceVariables = (text: string) => {
    let result = text;
    template.variables.forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      result = result.replace(regex, sampleData[variable] || `[${variable}]`);
    });
    return result;
  };

  const previewSubject = replaceVariables(template.subject);
  const previewContent = replaceVariables(template.html_content);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Sample Data Editor */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sample Data</CardTitle>
            <CardDescription>
              Edit these values to see how they appear in the email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {template.variables.map((variable) => (
              <div key={variable}>
                <Label htmlFor={`sample-${variable}`} className="text-sm font-medium">
                  {variable.replace(/_/g, ' ')}
                </Label>
                <Input
                  id={`sample-${variable}`}
                  value={sampleData[variable] || ''}
                  onChange={(e) => setSampleData(prev => ({
                    ...prev,
                    [variable]: e.target.value
                  }))}
                  placeholder={`Sample ${variable.replace(/_/g, ' ').toLowerCase()}`}
                  className="mt-1"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Email Preview */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Email Preview</CardTitle>
            <CardDescription>
              How the email will look to recipients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Subject Line Preview */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Subject:</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <p className="font-medium">{previewSubject}</p>
                </div>
              </div>

              {/* Email Content Preview */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Content:</Label>
                <div 
                  className="mt-1 p-4 bg-white border rounded-md max-h-96 overflow-y-auto"
                  style={{ fontFamily: 'system-ui, -apple-system' }}
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              </div>

              {/* Send Test Email */}
              <div className="pt-4 border-t">
                <TestEmailSender template={template} sampleData={sampleData} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface TestEmailSenderProps {
  template: EmailTemplate;
  sampleData: Record<string, string>;
}

const TestEmailSender: React.FC<TestEmailSenderProps> = ({ template, sampleData }) => {
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const sendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          template_id: template.id,
          recipient_email: testEmail,
          variables: sampleData,
        }
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: `Test email sent successfully to ${testEmail}`,
      });
      setTestEmail('');
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Send Test Email</Label>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="test@example.com"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="flex-1"
        />
        <Button 
          onClick={sendTestEmail}
          disabled={sending || !testEmail}
          size="sm"
        >
          {sending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Test
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Send a test email with the current sample data to verify how it looks
      </p>
    </div>
  );
};

interface EmailTemplateEditorProps {
  template: EmailTemplate | null;
  onSave: (data: Partial<EmailTemplate>) => void;
  onCancel: () => void;
}

const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    html_content: template?.html_content || '',
    text_content: template?.text_content || '',
    variables: template?.variables?.join(', ') || '',
    description: template?.description || '',
    is_active: template?.is_active ?? true,
  });

  const [previewData, setPreviewData] = useState<Record<string, string>>({
    customer_name: 'John Smith',
    booking_date: 'Friday, 12 September 2025',
    booking_time: '10:00 AM',
    service_type: 'Domestic Cleaning',
    address: '123 Main Street, London',
    total_cost: '£150.00',
    cleaner_name: 'Maria Garcia',
  });

  const replaceVariables = (text: string) => {
    let result = text;
    const variables = formData.variables
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);
    
    variables.forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      result = result.replace(regex, previewData[variable] || `[${variable}]`);
    });
    return result;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const variables = formData.variables
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);

    onSave({
      ...formData,
      variables,
    });
  };

  const previewSubject = replaceVariables(formData.subject);
  const previewContent = replaceVariables(formData.html_content);

  return (
    <Tabs defaultValue="edit" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="edit">Edit Template</TabsTrigger>
        <TabsTrigger value="preview">Live Preview</TabsTrigger>
      </TabsList>
      
      <TabsContent value="edit" className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <div className="flex gap-2">
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                required
                placeholder="Use {{variable_name}} for dynamic content"
                className="flex-1"
              />
              <VariablePicker 
                onInsert={(variable) => setFormData(prev => ({ 
                  ...prev, 
                  subject: prev.subject + variable 
                }))} 
              />
            </div>
          </div>

          <div>
            <Label htmlFor="variables">Variables (comma-separated)</Label>
            <Input
              id="variables"
              value={formData.variables}
              onChange={(e) => setFormData(prev => ({ ...prev, variables: e.target.value }))}
              placeholder="customer_name, booking_date, total_cost"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Variables used in your template will be auto-detected when you use the picker
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="html_content">HTML Content</Label>
              <VariablePicker 
                onInsert={(variable) => setFormData(prev => ({ 
                  ...prev, 
                  html_content: prev.html_content + variable 
                }))} 
              />
            </div>
            <Textarea
              id="html_content"
              rows={12}
              value={formData.html_content}
              onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
              required
              placeholder="Use {{variable_name}} for dynamic content"
              className="font-mono text-sm"
            />
          </div>

          <div>
            <Label htmlFor="text_content">Plain Text Content (Optional)</Label>
            <Textarea
              id="text_content"
              rows={6}
              value={formData.text_content}
              onChange={(e) => setFormData(prev => ({ ...prev, text_content: e.target.value }))}
              placeholder="Plain text version of the email"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {template ? 'Update' : 'Create'} Template
            </Button>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="preview" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Sample Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sample Data</CardTitle>
              <CardDescription>
                Edit these values to see live preview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.variables
                .split(',')
                .map(v => v.trim())
                .filter(v => v.length > 0)
                .map((variable) => (
                  <div key={variable}>
                    <Label htmlFor={`preview-${variable}`} className="text-sm font-medium">
                      {variable.replace(/_/g, ' ')}
                    </Label>
                    <Input
                      id={`preview-${variable}`}
                      value={previewData[variable] || ''}
                      onChange={(e) => setPreviewData(prev => ({
                        ...prev,
                        [variable]: e.target.value
                      }))}
                      placeholder={`Sample ${variable.replace(/_/g, ' ').toLowerCase()}`}
                      className="mt-1"
                    />
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Right Column - Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Live Preview</CardTitle>
              <CardDescription>
                Real-time preview of your template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Subject Preview */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Subject:</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <p className="font-medium">{previewSubject}</p>
                  </div>
                </div>

                {/* Content Preview */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Content:</Label>
                  <div 
                    className="mt-1 p-4 bg-white border rounded-md max-h-80 overflow-y-auto"
                    style={{ fontFamily: 'system-ui, -apple-system' }}
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};