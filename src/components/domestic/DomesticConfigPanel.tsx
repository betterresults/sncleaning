import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AirbnbConfigPanel } from '@/components/airbnb/AirbnbConfigPanel';

export const DomesticConfigPanel: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Domestic Form Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure options for the domestic cleaning booking form. The domestic form uses the same field configurations as Airbnb, 
          plus the "Domestic Service Frequency" category for weekly/biweekly/monthly/one-time options.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">Shared Configuration</h3>
            <p className="text-sm text-blue-700">
              The domestic cleaning form shares most field configurations with the Airbnb form (Property Type, Bedrooms, Bathrooms, 
              Additional Rooms, Oven Cleaning, Cleaning Supplies, etc.). The main difference is:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
              <li><strong>Service Frequency</strong> (Weekly, Biweekly, Monthly, One-time) instead of Service Type</li>
              <li><strong>No Linens step</strong> - removed for domestic cleaning</li>
              <li><strong>Different pricing</strong> - based on frequency rather than Airbnb service type</li>
            </ul>
          </div>
          
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h3 className="font-semibold text-amber-800 mb-2">How to Configure</h3>
            <p className="text-sm text-amber-700">
              To configure domestic-specific options, use the main Airbnb Form Settings page and look for the 
              "Domestic Service Frequency" category. You can add/edit the frequency options (weekly, biweekly, monthly, one-time) 
              and set their pricing values there.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">All Field Configurations</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Below is the full configuration panel. Look for "Domestic Service Frequency" category to configure domestic-specific options.
        </p>
        <AirbnbConfigPanel />
      </Card>
    </div>
  );
};