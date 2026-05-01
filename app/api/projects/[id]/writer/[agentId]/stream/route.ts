import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { streamText } from "ai";
import { getProviderModel } from "@/lib/ai/providers";
import {
  SYSTEM_PROMPT_WRITER,
  buildWriterUserPrompt,
} from "@/lib/ai/prompts";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; agentId: string }> }
) {
  try {
    const { id: projectId, agentId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { agents: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const agent = project.agents.find((a) => a.id === agentId);
    if (!agent || agent.role !== "writer") {
      return NextResponse.json({ error: "Writer not found" }, { status: 404 });
    }

    await prisma.document.upsert({
      where: { projectId_agentId: { projectId, agentId } },
      update: { status: "generating", content: "", errorMsg: null },
      create: {
        projectId,
        agentId,
        content: "",
        type: project.docType,
        status: "generating",
      },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "running" },
    });

    const result = await streamText({
      model: getProviderModel(agent.model),
      system: SYSTEM_PROMPT_WRITER,
      prompt: buildWriterUserPrompt(project.idea, project.docType as "prd" | "spec"),
    });

    let fullText = "";
    const textStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.fullStream) {
            if (chunk.type === "text-delta") {
              fullText += chunk.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text-delta", text: chunk.text })}\n\n`));
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    await prisma.document.update({
      where: { projectId_agentId: { projectId, agentId } },
      data: { content: fullText, status: "completed" },
    });

    return new Response(textStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in writer stream:", error);
    return NextResponse.json(
      { error: "Stream failed" },
      { status: 500 }
    );
  }
}