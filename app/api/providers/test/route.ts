import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export async function POST(req: NextRequest) {
  try {
    const { apiBase, apiKey, model } = await req.json();

    if (!apiBase || !apiKey) {
      return NextResponse.json(
        { success: false, error: "API Base URL and API Key are required" },
        { status: 400 }
      );
    }

    const provider = createOpenAI({
      baseURL: `${apiBase.replace(/\/$/, "")}/v1`,
      apiKey: apiKey,
    });

    const modelId = model || "gpt-4o";

    const { text } = await generateText({
      model: provider(modelId),
      prompt: "Hello",
      maxOutputTokens: 5,
    });

    return NextResponse.json({
      success: true,
      message: `Connection successful! Model response: "${text}"`,
    });
  } catch (error) {
    console.error("Provider test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      },
      { status: 200 }
    );
  }
}
