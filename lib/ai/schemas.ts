import { z } from "zod";

export const CreateProjectSchema = z.object({
  title: z.string().min(1).max(200),
  idea: z.string().min(1).max(5000),
  docType: z.enum(["prd", "spec"]),
  agents: z
    .array(
      z.object({
        name: z.string().min(1),
        role: z.enum(["writer", "reviewer"]),
        model: z.string(),
        providerId: z.string().optional(),
      })
    )
    .refine(
      (agents) => agents.filter((a) => a.role === "writer").length >= 2,
      { message: "At least 2 writers required" }
    )
    .refine(
      (agents) => agents.filter((a) => a.role === "reviewer").length >= 1,
      { message: "At least 1 reviewer required" }
    ),
});

export const UpdateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  idea: z.string().min(1).max(5000).optional(),
});

export const UpdateDocumentSchema = z.object({
  content: z.string(),
});

export const ReviewerOutputSchema = z.object({
  scores: z.array(
    z.object({
      writerName: z.string(),
      writerId: z.string(),
      score: z.number().min(1).max(10),
      comment: z.string(),
    })
  ),
  best: z.object({
    writerName: z.string(),
    writerId: z.string(),
    reason: z.string(),
  }),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type ReviewerOutput = z.infer<typeof ReviewerOutputSchema>;