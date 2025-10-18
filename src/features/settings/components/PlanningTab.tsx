/**
 * Planning Tab
 * Tab content for planning parameters configuration
 */

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlanningSettingsForm } from "./PlanningSettingsForm";

export function PlanningTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Planning Parameters</CardTitle>
        <CardDescription>
          Configure operational settings for subscription warnings, body
          checkups, payment reminders, session limits, and auto-inactivation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PlanningSettingsForm />
      </CardContent>
    </Card>
  );
}
