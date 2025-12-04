import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        <div className="border-b border-border bg-card rounded-t-lg">
          <TabsList className="h-auto p-1 bg-transparent gap-1 flex-wrap justify-start">
            <TabsTrigger 
              value="templates" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 rounded-md transition-all"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Templates
            </TabsTrigger>
            <TabsTrigger 
              value="sms-templates" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 rounded-md transition-all"
            >
              <FileText className="h-4 w-4 mr-2" />
              SMS Templates
            </TabsTrigger>
            <TabsTrigger 
              value="triggers" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 rounded-md transition-all"
            >
              <Settings className="h-4 w-4 mr-2" />
              Triggers
            </TabsTrigger>
            <TabsTrigger 
              value="email" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 rounded-md transition-all"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </TabsTrigger>
            <TabsTrigger 
              value="sms" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 rounded-md transition-all"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send SMS
            </TabsTrigger>
            <TabsTrigger 
              value="logs" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 rounded-md transition-all"
            >
              <Activity className="h-4 w-4 mr-2" />
              Logs
            </TabsTrigger>
            <TabsTrigger 
              value="test" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 rounded-md transition-all"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="bg-card border border-t-0 border-border rounded-b-lg p-6">
          <TabsContent value="templates" className="mt-0">
            <EmailTemplateManager />
          </TabsContent>

          <TabsContent value="sms-templates" className="mt-0">
            <SMSTemplateManager />
          </TabsContent>

          <TabsContent value="triggers" className="mt-0">
            <NotificationTriggersManager />
          </TabsContent>

          <TabsContent value="email" className="mt-0">
            <EmailNotificationManager />
          </TabsContent>

          <TabsContent value="sms" className="mt-0">
            <SMSNotificationManager />
          </TabsContent>

          <TabsContent value="logs" className="mt-0">
            <NotificationLogsViewer />
          </TabsContent>

          <TabsContent value="test" className="mt-0">
            <NotificationTestInterface />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
