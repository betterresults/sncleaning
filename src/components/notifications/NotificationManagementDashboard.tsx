import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailTemplateManager } from "./EmailTemplateManager";
import { NotificationTriggersManager } from "./NotificationTriggersManager";
import { NotificationLogsViewer } from "./NotificationLogsViewer";
import { NotificationTestInterface } from "./NotificationTestInterface";
import SMSNotificationManager from "./SMSNotificationManager";
import SMSTemplateManager from "./SMSTemplateManager";
import EmailNotificationManager from "./EmailNotificationManager";
import { Mail, Settings, Activity, TestTube, MessageSquare, FileText, Send } from "lucide-react";

export const NotificationManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState("templates");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="sms-templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            SMS Templates
          </TabsTrigger>
          <TabsTrigger value="triggers" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Triggers
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Email
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Send SMS
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Create and manage email templates with dynamic variables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailTemplateManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms-templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMS Templates</CardTitle>
              <CardDescription>
                Create and manage reusable SMS templates with dynamic variables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SMSTemplateManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triggers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Triggers</CardTitle>
              <CardDescription>
                Configure when and how notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationTriggersManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Send email messages to customers and cleaners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailNotificationManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMS Notifications</CardTitle>
              <CardDescription>
                Send SMS messages to customers and cleaners via Twilio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SMSNotificationManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Logs</CardTitle>
              <CardDescription>
                View delivery status and history of sent notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationLogsViewer />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Notifications</CardTitle>
              <CardDescription>
                Send test emails to verify templates and delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationTestInterface />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};