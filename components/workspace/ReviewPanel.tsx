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
      <Card className="w-full">
        <Card.Content className="text-center py-12 text-default-500">
          <div className="flex flex-col items-center gap-3">
            <Trophy size={48} className="text-gray-300" />
            <p>No review yet. Generate documents first.</p>
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
      <Card className="w-full">
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
        <span className="text-gray-300">{'░'.repeat(empty)}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Best Document Card */}
      <Card className="w-full border-2 border-warning bg-warning-50/50">
        <Card.Header className="bg-warning-100 border-b border-warning-200">
          <div className="flex items-center gap-3">
            <Trophy className="text-warning" size={28} />
            <div>
              <span className="text-xs font-semibold text-warning-700 uppercase tracking-wide">Best Choice</span>
              <p className="font-bold text-lg text-warning-900">{review.best.writerName}</p>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          <p className="text-sm text-gray-600 dark:text-gray-300">{review.best.reason}</p>
          {review.best.writerId && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">ID: {review.best.writerId}</span>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Score Cards */}
      <div className="border-t border-default-200 pt-4">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <TrendingUp size={20} />
          All Scores
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {review.scores.map((score, idx) => {
            const isBest = score.writerId === review.best.writerId;
            return (
              <Card
                key={idx}
                className={`w-full ${isBest ? 'border-2 border-success bg-success-50/50' : ''}`}
              >
                <Card.Header className="flex justify-between items-center pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{score.writerName}</span>
                    {isBest && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-success-100 text-success-700 rounded-full">
                        ⭐ BEST
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {renderScoreBar(score.score)}
                    <span className="ml-2 font-bold text-lg">
                      {score.score.toFixed(1)}
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
