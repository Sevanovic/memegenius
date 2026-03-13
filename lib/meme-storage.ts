import fs from "fs";
import path from "path";

// ============================================================
// lib/meme-storage.ts — Stockage des memes
//
// Sur Vercel : utilise /tmp/ (seul dossier inscriptible)
// En local : utilise public/memes/
//
// NOTE : /tmp/ sur Vercel est éphémère — les fichiers sont perdus
// entre les invocations de fonction. C'est OK pour le MVP.
// Pour la persistence, il faudra migrer vers Supabase Storage.
// ============================================================

const IS_VERCEL = !!process.env.VERCEL;
const MEMES_DIR = IS_VERCEL
  ? path.join("/tmp", "memes")
  : path.join(process.cwd(), "public", "memes");

export interface MemeData {
  id: string;
  template_name: string;
  texts: string[];
  humor_style: string;
  prompt: string;
  created_at: string;
}

function ensureDir() {
  try {
    if (!fs.existsSync(MEMES_DIR)) {
      fs.mkdirSync(MEMES_DIR, { recursive: true });
    }
  } catch {
    // Silently fail — saving is optional
  }
}

export function generateMemeId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export function saveMeme(
  id: string,
  imageBase64: string,
  data: Omit<MemeData, "id" | "created_at">
): MemeData | null {
  try {
    ensureDir();

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");
    fs.writeFileSync(path.join(MEMES_DIR, `${id}.png`), imageBuffer);

    const memeData: MemeData = {
      id,
      ...data,
      created_at: new Date().toISOString(),
    };
    fs.writeFileSync(
      path.join(MEMES_DIR, `${id}.json`),
      JSON.stringify(memeData, null, 2)
    );

    return memeData;
  } catch {
    // Save failed (read-only fs, etc.) — not critical
    return null;
  }
}

export function getMeme(id: string): MemeData | null {
  try {
    const jsonPath = path.join(MEMES_DIR, `${id}.json`);
    if (!fs.existsSync(jsonPath)) return null;
    const raw = fs.readFileSync(jsonPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function memeImageExists(id: string): boolean {
  try {
    return fs.existsSync(path.join(MEMES_DIR, `${id}.png`));
  } catch {
    return false;
  }
}

// Retourne le chemin du fichier image pour le servir
export function getMemeImagePath(id: string): string | null {
  const imgPath = path.join(MEMES_DIR, `${id}.png`);
  if (fs.existsSync(imgPath)) return imgPath;
  return null;
}
