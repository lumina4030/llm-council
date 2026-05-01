"use client";

import { Card, Chip } from "@heroui/react";
import { Star, Trophy } from "lucide-react";
import type { ReviewerOutput } from "@/lib/ai/schemas";

interface ReviewPanelProps {
  reviewPayload: string | null;
}

export function ReviewPanel({ reviewPayload }: ReviewPanelProps) {
  if (!reviewPayload) {
    return (
      <Card className="w-full">
        <Card.Content className="text-center py-12 text-default-500">
          No review yet. Generate documents first.
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

  return (
    <div className="space-y-4">
      <Card className="w-full border-2 border-warning">
        <Card.Header className="bg-warning-50">
          <div className="flex items-center gap-2">
            <Trophy className="text-warning" size={24} />
            <span className="font-bold text-lg">Best Document</span>
          </div>
        </Card.Header>
        <Card.Content>
          <p className="font-semibold text-lg">{review.best.writerName}</p>
          <p className="text-sm text-default-500 mt-1">{review.best.reason}</p>
        </Card.Content>
      </Card>

      <div className="border-t border-default-200" />

      <h3 className="font-semibold text-lg">All Scores</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {review.scores.map((score, idx) => (
          <Card key={idx} className="w-full">
            <Card.Header className="flex justify-between">
              <span className="font-medium">{score.writerName}</span>
              <div className="flex items-center gap-1">
                <Star className="text-warning" size={16} fill="currentColor" />
                <span className="font-bold">{score.score}/10</span>
              </div>
            </Card.Header>
            <Card.Content>
              <p className="text-sm text-default-600">{score.comment}</p>
            </Card.Content>
          </Card>
        ))}
      </div>
    </div>
  );
}