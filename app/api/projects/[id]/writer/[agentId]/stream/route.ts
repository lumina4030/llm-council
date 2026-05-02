import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { streamText } from "ai";
import { getModelForProvider } from "@/lib/ai/providers";
import {
  SYSTEM_PROMPT_WRITER,
  buildWriterUserPrompt,
} from "@/lib/ai/prompts";
import type { ProviderConfig } from "@/lib/ai/providers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; agentId: string }> }
) {
  try {
    const { id: projectId, agentId } = await params;
    const body = await req.json().catch(() => ({}));
    const providerConfig: ProviderConfig | undefined = body.providerConfig;

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

    let model;
    if (providerConfig) {
      model = getModelForProvider(providerConfig, agent.model);
    } else {
      throw new Error("No provider configuration provided");
    }

    const result = await streamText({
      model,
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