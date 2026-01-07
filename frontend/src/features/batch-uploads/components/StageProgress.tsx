import { CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BatchStage, BatchProgressEvent, STAGE_LABELS } from "../types";

interface StageProgressProps {
  progress: BatchProgressEvent | null;
}

const STAGES_ORDER: BatchStage[] = [
  BatchStage.TRANSCRIBING,
  BatchStage.DETECTING,
  BatchStage.ANALYZING,
  BatchStage.GENERATING,
];

function getStageIndex(stage: BatchStage): number {
  if (stage === BatchStage.UPLOADING) return 0;
  const index = STAGES_ORDER.indexOf(stage);
  return index >= 0 ? index : -1;
}

export function StageProgress({ progress }: StageProgressProps) {
  if (!progress) return null;

  const currentStageIndex = getStageIndex(progress.stage);
  const isDone = progress.stage === BatchStage.DONE;

  // Calculate overall percentage
  let percentage = 0;
  if (isDone) {
    percentage = 100;
  } else if (currentStageIndex >= 0) {
    const stageWeight = 100 / STAGES_ORDER.length;
    percentage = currentStageIndex * stageWeight;

    // Add progress within current stage
    if (progress.total > 0) {
      const withinStageProgress = (progress.current / progress.total) * stageWeight;
      percentage += withinStageProgress;
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-card border border-gray-100">
      {/* Stage indicators */}
      <div className="flex items-center justify-between mb-6">
        {STAGES_ORDER.map((stage, index) => {
          const isActive = currentStageIndex === index && !isDone;
          const isCompleted = currentStageIndex > index || isDone;

          return (
            <div key={stage} className="flex items-center flex-1">
              {/* Stage circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                    isCompleted && "bg-green-500 border-green-500",
                    isActive && "bg-primary-500 border-primary-500",
                    !isActive && !isCompleted && "bg-white border-gray-200",
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <span className="text-sm font-medium text-gray-400">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-2 text-center max-w-[80px]",
                    isActive && "text-primary-600 font-medium",
                    isCompleted && "text-green-600",
                    !isActive && !isCompleted && "text-gray-400",
                  )}
                >
                  {STAGE_LABELS[stage].label}
                </span>
              </div>

              {/* Connector line */}
              {index < STAGES_ORDER.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors",
                    currentStageIndex > index || isDone ? "bg-green-500" : "bg-gray-200",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">
            {isDone ? "Concluído!" : progress.message}
          </span>
          <span className="text-gray-500">{Math.round(percentage)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className={cn(
              "progress-bar-fill transition-all duration-500",
              isDone && "bg-green-500",
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
