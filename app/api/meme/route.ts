import { NextRequest, NextResponse } from "next/server";
import { getMemeImagePath, getMeme } from "@/lib/meme-storage";
import fs from "fs";

// ============================================================
// /api/meme?id=abc12345 — Sert l'image PNG d'un meme
//
// Sur Vercel, les fichiers dans /tmp/ ne sont pas accessibles
// via /public/. Cet endpoint les sert dynamiquement.
// ============================================================

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id || !/^[a-z0-9]{8}$/.test(id)) {
    return NextResponse.json({ error: "Invalid meme ID" }, { status: 400 });
  }

  const imagePath = getMemeImagePath(id);

  if (!imagePath) {
    return NextResponse.json({ error: "Meme not found" }, { status: 404 });
  }

  try {
    const imageBuffer = fs.readFileSync(imagePath);
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Error reading image" }, { status: 500 });
  }
}
