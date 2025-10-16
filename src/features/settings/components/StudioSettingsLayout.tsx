"use client";

import { memo, useCallback, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { OpeningHoursTab } from "./OpeningHoursTab";
import { Settings, Clock, CreditCard, Building } from "lucide-react";

function StudioSettingsLayoutComponent() {
  const [activeTab, setActiveTab] = useState("opening-hours");

  // Use useCallback for event handler
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Studio Settings</h1>
        </div>
        <p className="text-muted-foreground mt-2">
          Configure your gym&apos;s operational settings and preferences
        </p>
      </div>

      {/* Tabbed Interface */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="opening-hours" className="gap-2">
            <Clock className="h-4 w-4" />
            Opening Hours
          </TabsTrigger>
          <TabsTrigger value="general" disabled className="gap-2">
            <Building className="h-4 w-4" />
            General
            <span className="text-muted-foreground ml-2 text-xs">
              (Coming Soon)
            </span>
          </TabsTrigger>
          <TabsTrigger value="payment" disabled className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payment
            <span className="text-muted-foreground ml-2 text-xs">
              (Coming Soon)
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="opening-hours">
          <OpeningHoursTab />
        </TabsContent>

        <TabsContent value="general">
          <Card className="p-6">
            <p className="text-muted-foreground">
              General settings coming soon...
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card className="p-6">
            <p className="text-muted-foreground">
              Payment settings coming soon...
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Use React.memo for performance optimization
export const StudioSettingsLayout = memo(StudioSettingsLayoutComponent);
StudioSettingsLayout.displayName = "StudioSettingsLayout";
