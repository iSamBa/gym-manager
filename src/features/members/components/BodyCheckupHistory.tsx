/**
 * Body Checkup History
 * Displays chronological list of member body checkup records
 */

"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Scale,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import type { BodyCheckup } from "../lib/types";

interface BodyCheckupHistoryProps {
  checkups: BodyCheckup[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (checkup: BodyCheckup) => void;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}

export function BodyCheckupHistory({
  checkups,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  isDeleting,
}: BodyCheckupHistoryProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Calculate weight trends
  const checkupsWithTrend = useMemo(() => {
    return checkups.map((checkup, index) => {
      if (index === checkups.length - 1 || !checkup.weight) {
        return { ...checkup, trend: null };
      }

      const nextCheckup = checkups[index + 1];
      if (!nextCheckup.weight) {
        return { ...checkup, trend: null };
      }

      const diff = checkup.weight - nextCheckup.weight;
      const trend = diff > 0 ? "up" : diff < 0 ? "down" : "same";
      return { ...checkup, trend, diff: Math.abs(diff) };
    });
  }, [checkups]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await onDelete(deleteId);
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base">
              <Scale className="h-4 w-4" />
              Body Checkups
            </span>
            <Button size="sm" onClick={onAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Checkup
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base">
              <Scale className="h-4 w-4" />
              Body Checkups
            </span>
            <Button size="sm" onClick={onAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Checkup
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checkups.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
              <Scale className="mb-2 h-12 w-12 opacity-20" />
              <p>No body checkup records yet</p>
              <p className="text-sm">
                Click &quot;Add Checkup&quot; to record the first one
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {checkupsWithTrend.map((checkup) => (
                <div
                  key={checkup.id}
                  className="border-border flex items-start justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {format(new Date(checkup.checkup_date), "PPP")}
                      </p>
                      {checkup.weight && (
                        <Badge variant="outline" className="ml-auto">
                          {checkup.weight} kg
                        </Badge>
                      )}
                      {checkup.trend && checkup.diff && (
                        <Badge
                          variant={
                            checkup.trend === "up"
                              ? "destructive"
                              : checkup.trend === "down"
                                ? "default"
                                : "secondary"
                          }
                          className="flex items-center gap-1"
                        >
                          {checkup.trend === "up" ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : checkup.trend === "down" ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : (
                            <Minus className="h-3 w-3" />
                          )}
                          {checkup.trend !== "same" &&
                            `${checkup.diff.toFixed(1)} kg`}
                        </Badge>
                      )}
                    </div>
                    {checkup.notes && (
                      <p className="text-muted-foreground text-sm">
                        {checkup.notes}
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      Added {format(new Date(checkup.created_at), "PPp")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(checkup)}
                      disabled={isDeleting}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteId(checkup.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="text-destructive h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Body Checkup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this body checkup record? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
