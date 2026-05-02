import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateProjectSchema } from "@/lib/ai/schemas";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { agents: true },
    });
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        title: validated.title,
        idea: validated.idea,
        docType: validated.docType,
        status: "idle",
        agents: {
          create: validated.agents.map((agent) => ({
            name: agent.name,
            role: agent.role,
            model: agent.model,
            providerId: agent.providerId || null,
          })),
        },
      },
      include: { agents: true },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}