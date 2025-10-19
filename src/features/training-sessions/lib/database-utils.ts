import { supabase } from "@/lib/supabase";
import type { TrainingSession } from "./types";
import { executeQuery } from "@/features/database/lib/query-helpers";

export const trainingSessionUtils = {
  // Update training session status - follows exact same pattern as member status update
  async updateTrainingSessionStatus(
    id: string,
    status: TrainingSession["status"]
  ): Promise<TrainingSession> {
    return executeQuery(async () => {
      return await supabase
        .from("training_sessions")
        .update({ status })
        .eq("id", id)
        .select("*")
        .single();
    });
  },
};
