"use client";

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
import { AlertTriangle } from "lucide-react";

interface DeleteTrainerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  trainerName: string;
  isDeleting?: boolean;
}

export function DeleteTrainerDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  trainerName,
  isDeleting = false,
}: DeleteTrainerDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <AlertDialogTitle>Delete Trainer</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            Are you sure you want to delete{" "}
            <span className="font-medium">{trainerName}</span>? This action
            cannot be undone.
            <br />
            <br />
            <span className="text-muted-foreground text-sm">
              This will permanently remove the trainer and all associated data
              including classes and sessions.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? "Deleting..." : "Delete Trainer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
