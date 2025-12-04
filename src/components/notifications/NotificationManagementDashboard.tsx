import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailTemplateManager } from "./EmailTemplateManager";
import { NotificationTriggersManager } from "./NotificationTriggersManager";
import { NotificationLogsViewer } from "./NotificationLogsViewer";
import { NotificationTestInterface } from "./NotificationTestInterface";
import SMSNotificationManager from "./SMSNotificationManager";
import SMSTemplateManager from "./SMSTemplateManager";
import EmailNotificationManager from "./EmailNotificationManager";
import { Mail, Settings, Activity, TestTube, MessageSquare, FileText, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "templates", label: "Email Templates", icon: Mail },
  { id: "sms-templates", label: "SMS Templates", icon: FileText },
  { id: "triggers", label: "Triggers", icon: Settings },
  { id: "email", label: "Send Email", icon: Send },
  { id: "sms", label: "Send SMS", icon: MessageSquare },
  { id: "logs", label: "Logs", icon: Activity },
  { id: "test", label: "Test", icon: TestTube },
];

export const NotificationManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState("templates");

  const renderContent = () => {
    switch (activeTab) {
      case "templates":
        return <EmailTemplateManager />;
      case "sms-templates":
        return <SMSTemplateManager />;
      case "triggers":
        return <NotificationTriggersManager />;
      case "email":
        return <EmailNotificationManager />;
      case "sms":
        return <SMSNotificationManager />;
      case "logs":
        return <NotificationLogsViewer />;
      case "test":
        return <NotificationTestInterface />;
      default:
        return <EmailTemplateManager />;
    }
  };

  const getTitle = () => {
    const tab = tabs.find(t => t.id === activeTab);
    return tab?.label || "Notifications";
  };

  const ActiveIcon = tabs.find(t => t.id === activeTab)?.icon || Mail;

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-100 shadow-md hover:shadow-lg border border-gray-100"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Card */}
      <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <ActiveIcon className="h-5 w-5" />
            {getTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};
