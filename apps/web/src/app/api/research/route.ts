import { searchWeb } from "agent-core";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z
  .object({
    query: z.string().trim().min(3).max(500),
    results: z.number().int().min(1).max(8).optional(),
  })
  .strict();

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    const result = await searchWeb({
      query: input.query,
      results: input.results ?? 4,
    });

    if (typeof result === "string") {
      return Response.json({ status: "unavailable", message: result }, { status: 503 });
    }

    return Response.json(
      { status: "live", query: input.query, results: result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return Response.json(
        { status: "invalid", message: "Research requires a short, valid query." },
        { status: 400 },
      );
    }
    return Response.json(
      { status: "error", message: "Exa research failed. Keep the evidence state unverified." },
      { status: 502 },
    );
  }
}
