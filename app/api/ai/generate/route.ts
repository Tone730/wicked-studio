import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const API = "https://api.replicate.com/v1";
const allowedModels = new Set(["black-forest-labs/flux-schnell","black-forest-labs/flux-dev","bytedance/seedance-1-pro"]);
export async function POST(request: NextRequest) {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) return NextResponse.json({ error: "Replicate is not configured. Add REPLICATE_API_TOKEN to the server environment." }, { status: 503 });
  try {
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const model = typeof body.model === "string" && allowedModels.has(body.model) ? body.model : "black-forest-labs/flux-schnell";
    if (!prompt) return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
    if (prompt.length > 4000) return NextResponse.json({ error: "Prompt must be 4,000 characters or fewer." }, { status: 400 });
    const input: Record<string, unknown> = { prompt };
    if (model.startsWith("black-forest-labs/")) {
      input.num_outputs = Math.min(4, Math.max(1, Number(body.num_outputs) || 1));
      input.aspect_ratio = typeof body.aspect_ratio === "string" ? body.aspect_ratio : "1:1";
      input.output_format = "png";
    } else {
      input.duration = Math.min(10, Math.max(2, Number(body.duration) || 5));
      input.aspect_ratio = typeof body.aspect_ratio === "string" ? body.aspect_ratio : "16:9";
    }
    const response = await fetch(API + "/models/" + model + "/predictions", { method: "POST", headers: { Authorization: "Bearer " + apiToken, "Content-Type": "application/json", Prefer: "wait=10" }, body: JSON.stringify({ input }), cache: "no-store" });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data?.detail || data?.error || "Replicate request failed.", providerStatus: response.status }, { status: response.status });
    return NextResponse.json({ id: data.id, status: data.status, output: data.output ?? null, error: data.error ?? null, model, urls: data.urls ?? null });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request." }, { status: 400 }); }
}
export async function GET(request: NextRequest) {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) return NextResponse.json({ error: "Replicate is not configured. Add REPLICATE_API_TOKEN to the server environment." }, { status: 503 });
  const imageUrl = request.nextUrl.searchParams.get("imageUrl");
  if (imageUrl) {
    let parsed: URL;
    try { parsed = new URL(imageUrl); } catch { return NextResponse.json({ error: "Invalid image URL." }, { status: 400 }); }
    if (parsed.protocol !== "https:" || !(parsed.hostname === "replicate.delivery" || parsed.hostname.endsWith(".replicate.delivery"))) return NextResponse.json({ error: "Only Replicate output URLs are allowed." }, { status: 400 });
    const imageResponse = await fetch(parsed.toString(), { headers: { Authorization: "Bearer " + apiToken }, cache: "no-store", redirect: "manual" });
    if (imageResponse.status >= 300 && imageResponse.status < 400) return NextResponse.json({ error: "Image provider returned an unsupported redirect." }, { status: 502 });
    if (!imageResponse.ok) return NextResponse.json({ error: "Could not retrieve generated image." }, { status: imageResponse.status });
    const contentType = imageResponse.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/")) return NextResponse.json({ error: "Provider response was not an image." }, { status: 502 });
    const declaredLength = Number(imageResponse.headers.get("content-length") || 0);
    if (declaredLength > 20 * 1024 * 1024) return NextResponse.json({ error: "Generated image exceeds the 20 MB import limit." }, { status: 413 });
    const bytes = await imageResponse.arrayBuffer();
    if (bytes.byteLength > 20 * 1024 * 1024) return NextResponse.json({ error: "Generated image exceeds the 20 MB import limit." }, { status: 413 });
    return new NextResponse(bytes, { headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=300" } });
  }
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !/^[a-z0-9-]{8,80}$/i.test(id)) return NextResponse.json({ error: "A valid prediction id or imageUrl is required." }, { status: 400 });
  const response = await fetch(API + "/predictions/" + id, { headers: { Authorization: "Bearer " + apiToken }, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) return NextResponse.json({ error: data?.detail || "Could not retrieve prediction." }, { status: response.status });
  return NextResponse.json({ id: data.id, status: data.status, output: data.output ?? null, error: data.error ?? null, urls: data.urls ?? null });
}