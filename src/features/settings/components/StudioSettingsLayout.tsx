"use client";

import { memo, useCallback, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { OpeningHoursTab } from "./OpeningHoursTab";
import { PlanningTab } from "./PlanningTab";
import { MultiSiteSessionsTab } from "./MultiSiteSessionsTab";
import { GeneralTab } from "./GeneralTab";
import { Clock, CreditCard, Building, Settings, Users } from "lucide-react";

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
        <h1 className="text-3xl font-bold">Studio Settings</h1>
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
          <TabsTrigger value="planning" className="gap-2">
            <Settings className="h-4 w-4" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="multi-site" className="gap-2">
            <Users className="h-4 w-4" />
            Multi-Site Sessions
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <Building className="h-4 w-4" />
            General
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

        <TabsContent value="planning">
          <PlanningTab />
        </TabsContent>

        <TabsContent value="multi-site">
          <MultiSiteSessionsTab />
        </TabsContent>

        <TabsContent value="general">
          <GeneralTab />
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
