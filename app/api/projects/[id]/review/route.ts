import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateObject } from "ai";
import { getProviderModel } from "@/lib/ai/providers";
import {
  SYSTEM_PROMPT_REVIEWER,
  buildReviewerPrompt,
} from "@/lib/ai/prompts";
import { ReviewerOutputSchema } from "@/lib/ai/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        agents: true,
        documents: { where: { status: "completed" } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const incompleteDocs = project.documents.filter((d) => d.status !== "completed");
    if (incompleteDocs.length > 0) {
      return NextResponse.json(
        { error: "Not all writers have completed" },
        { status: 400 }
      );
    }

    const reviewers = project.agents.filter((a) => a.role === "reviewer");
    if (reviewers.length === 0) {
      return NextResponse.json({ error: "No reviewer found" }, { status: 400 });
    }

    const reviewer = reviewers[0];

    const docs = project.documents.map((doc) => {
      const agent = project.agents.find((a) => a.id === doc.agentId)!;
      return {
        id: doc.id,
        name: agent.name,
        content: doc.content,
      };
    });

    const result = await generateObject({
      model: getProviderModel(reviewer.model),
      schema: ReviewerOutputSchema,
      system: SYSTEM_PROMPT_REVIEWER,
      prompt: buildReviewerPrompt(project.idea, docs),
    });

    await prisma.review.upsert({
      where: { projectId },
      update: { payload: JSON.stringify(result.object) },
      create: {
        projectId,
        payload: JSON.stringify(result.object),
      },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "completed" },
    });

    return NextResponse.json({ review: result.object });
  } catch (error) {
    console.error("Error in review:", error);
    return NextResponse.json(
      { error: "Review failed" },
      { status: 500 }
    );
  }
}