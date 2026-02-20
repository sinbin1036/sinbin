import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ ok: true, data: [] });
  }

  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=ko&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, data: [] });
    }

    // Firefox client returns: [query, [suggestion1, suggestion2, ...]]
    const json = await res.json();
    const suggestions: string[] = Array.isArray(json[1]) ? json[1].slice(0, 8) : [];

    return NextResponse.json({ ok: true, data: suggestions });
  } catch {
    return NextResponse.json({ ok: false, data: [] });
  }
}
