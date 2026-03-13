import fs from "fs";
import path from "path";

// ============================================================
// lib/meme-storage.ts — Stockage des memes sur le filesystem
//
// Chaque meme est sauvegardé comme :
// - /public/memes/{id}.png   → l'image du meme
// - /public/memes/{id}.json  → les métadonnées (template, texts, etc.)
//
// C'est une solution simple pour le MVP. Plus tard on migrera
// vers Supabase Storage ou S3.
// ============================================================

const MEMES_DIR = path.join(process.cwd(), "public", "memes");

export interface MemeData {
  id: string;
  template_name: string;
  texts: string[];
  humor_style: string;
  prompt: string;
  created_at: string;
}

// Assurer que le dossier existe
function ensureDir() {
  if (!fs.existsSync(MEMES_DIR)) {
    fs.mkdirSync(MEMES_DIR, { recursive: true });
  }
}

// Générer un ID court unique (8 chars)
export function generateMemeId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// Sauvegarder un meme (image + métadonnées)
export function saveMeme(
  id: string,
  imageBase64: string,
  data: Omit<MemeData, "id" | "created_at">
): MemeData {
  ensureDir();

  // Sauvegarder l'image PNG
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");
  fs.writeFileSync(path.join(MEMES_DIR, `${id}.png`), imageBuffer);

  // Sauvegarder les métadonnées
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
}

// Récupérer les métadonnées d'un meme
export function getMeme(id: string): MemeData | null {
  const jsonPath = path.join(MEMES_DIR, `${id}.json`);
  if (!fs.existsSync(jsonPath)) return null;

  try {
    const raw = fs.readFileSync(jsonPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Vérifier si l'image d'un meme existe
export function memeImageExists(id: string): boolean {
  return fs.existsSync(path.join(MEMES_DIR, `${id}.png`));
}

// Lister les derniers memes (pour la future galerie)
export function getRecentMemes(limit: number = 20): MemeData[] {
  ensureDir();

  const files = fs.readdirSync(MEMES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(MEMES_DIR, f), "utf-8");
      return JSON.parse(raw) as MemeData;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);

  return files;
}
