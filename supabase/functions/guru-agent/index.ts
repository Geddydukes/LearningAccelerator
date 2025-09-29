import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface GuruRequest {
  message: string;
  userId: string;
  sessionId?: string;
  context?: {
    currentPhase?: string;
    week?: number;
    day?: number;
    artifacts?: Record<string, any>;
  };
}

interface GuruResponse {
  success: boolean;
  data?: {
    response: string;
    nextPhase?: string;
    artifacts?: Record<string, any>;
    suggestions?: string[];
  };
  error?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    const { message, userId, sessionId, context }: GuruRequest =
      await req.json();

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Load Guru V1 prompt from storage
    const promptResponse = await fetch(
      `${Deno.env.get(
        "SUPABASE_URL"
      )}/storage/v1/object/public/prompts/guru_v1.md`,
      {
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
      }
    );

    if (!promptResponse.ok) {
      throw new Error("Failed to load Guru prompt");
    }

    const guruPrompt = await promptResponse.text();

    // Prepare context for the prompt
    const contextString = context
      ? `
Current Context:
- Phase: ${context.currentPhase || "planning"}
- Week: ${context.week || 1}
- Day: ${context.day || 1}
- Session ID: ${sessionId || "new"}
- Artifacts: ${JSON.stringify(context.artifacts || {}, null, 2)}
`
      : "";

    const fullPrompt = `${guruPrompt}

${contextString}

User Message: ${message}

Please respond as Guru, following the guidelines above.`;

    // Call OpenAI API
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: fullPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      }
    );

    if (!openaiResponse.ok) {
      throw new Error("OpenAI API call failed");
    }

    const openaiData = await openaiResponse.json();
    const guruResponse =
      openaiData.choices[0]?.message?.content ||
      "I apologize, but I couldn't generate a response.";

    // Parse response for phase transitions and artifacts
    const responseData: GuruResponse["data"] = {
      response: guruResponse,
      suggestions: [
        "Continue learning",
        "Ask a question",
        "Request examples",
        "Need clarification",
      ],
    };

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Guru agent error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
