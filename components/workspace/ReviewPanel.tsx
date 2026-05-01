"use client";

import { Card } from "@heroui/react";
import { Star, Trophy, TrendingUp } from "lucide-react";
import type { ReviewerOutput } from "@/lib/ai/schemas";

interface ReviewPanelProps {
  reviewPayload: string | null;
}

export function ReviewPanel({ reviewPayload }: ReviewPanelProps) {
  if (!reviewPayload) {
    return (
      <Card className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
        <Card.Content className="text-center py-12 text-default-500">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800">
              <Trophy size={48} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-default-400">No review yet. Generate documents first.</p>
          </div>
        </Card.Content>
      </Card>
    );
  }

  let review: ReviewerOutput;
  try {
    review = JSON.parse(reviewPayload);
  } catch {
    return (
      <Card className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
        <Card.Content className="text-center py-12 text-danger">
          Failed to parse review data.
        </Card.Content>
      </Card>
    );
  }

  const renderScoreBar = (score: number) => {
    const filled = Math.round(score);
    const empty = 10 - filled;
    return (
      <span className="font-mono text-sm">
        <span className="text-warning">{'█'.repeat(filled)}</span>
        <span className="text-gray-300 dark:text-gray-600">{'░'.repeat(empty)}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Best Document Card */}
      <Card className="w-full border-2 border-warning bg-gradient-to-br from-warning-50/80 to-yellow-50/80 dark:from-warning-900/20 dark:to-yellow-900/20 shadow-lg">
        <Card.Header className="bg-gradient-to-r from-warning-100/80 to-yellow-100/80 dark:from-warning-900/30 dark:to-yellow-900/30 border-b border-warning-200/50 dark:border-warning-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-warning-400 to-yellow-400 shadow-lg">
              <Trophy className="text-white" size={24} />
            </div>
            <div>
              <span className="text-xs font-bold text-warning-700 dark:text-warning-300 uppercase tracking-wider">Best Choice</span>
              <p className="font-bold text-lg text-warning-900 dark:text-warning-100">{review.best.writerName}</p>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          <p className="text-sm text-gray-600 dark:text-gray-300">{review.best.reason}</p>
          {review.best.writerId && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-400">ID: {review.best.writerId}</span>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Score Cards */}
      <div className="border-t border-default-200/50 dark:border-gray-700/50 pt-4">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <TrendingUp size={18} className="text-purple-600 dark:text-purple-400" />
          </div>
          All Scores
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {review.scores.map((score, idx) => {
            const isBest = score.writerId === review.best.writerId;
            return (
              <Card
                key={idx}
                className={`w-full transition-all duration-300 hover:-translate-y-1 ${
                  isBest
                    ? 'border-2 border-success bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 shadow-success/20'
                    : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg'
                }`}
              >
                <Card.Header className="flex justify-between items-center pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{score.writerName}</span>
                    {isBest && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow">
                        ⭐ BEST
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {renderScoreBar(score.score)}
                    <span className="font-bold text-lg">
                      <span className="text-warning">{score.score.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">/10</span>
                    </span>
                  </div>
                </Card.Header>
                <Card.Content>
                  <p className="text-sm text-default-600 dark:text-default-400">
                    {score.comment}
                  </p>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}