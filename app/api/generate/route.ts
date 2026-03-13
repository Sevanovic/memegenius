import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { generateMemeId, saveMeme } from "@/lib/meme-storage";

// ============================================================
// /api/generate — Version 7 : Imgflip compose + rebranding
//
// Flow :
// 1. Claude génère les textes pour 4 memes
// 2. Pour chaque meme, on appelle Imgflip /caption_image
// 3. On TÉLÉCHARGE l'image composée par Imgflip
// 4. Avec Sharp on :
//    a) Crop le bas de l'image (zone du watermark Imgflip)
//    b) Ajoute notre watermark "MemeGenius.ai"
// 5. On retourne l'image modifiée en base64 data URL
//
// Résultat : positionnement parfait par Imgflip + notre branding
// ============================================================

// --- Cache templates ---
let cachedTemplates: ImgflipMeme[] = [];
let cacheTs = 0;

interface ImgflipMeme {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
}

async function getTemplates(): Promise<ImgflipMeme[]> {
  if (cachedTemplates.length > 0 && Date.now() - cacheTs < 3600000) {
    return cachedTemplates;
  }
  try {
    const res = await fetch("https://api.imgflip.com/get_memes");
    const data = await res.json();
    if (data.success) {
      cachedTemplates = data.data.memes.slice(0, 100);
      cacheTs = Date.now();
      return cachedTemplates;
    }
  } catch (e) {
    console.error("Imgflip get_memes error:", e);
  }
  return [
    { id: "181913649", name: "Drake Hotline Bling", url: "https://i.imgflip.com/30b1gx.jpg", width: 1200, height: 1200, box_count: 2 },
    { id: "87743020", name: "Two Buttons", url: "https://i.imgflip.com/1g8my4.jpg", width: 600, height: 908, box_count: 3 },
    { id: "112126428", name: "Distracted Boyfriend", url: "https://i.imgflip.com/1ur9b0.jpg", width: 1200, height: 800, box_count: 3 },
    { id: "93895088", name: "Expanding Brain", url: "https://i.imgflip.com/1jwhww.jpg", width: 857, height: 1202, box_count: 4 },
  ];
}

// --- Compose meme via Imgflip + rebrand ---
async function composeMeme(
  templateId: string,
  texts: string[],
  username: string,
  password: string
): Promise<string | null> {
  // 1. Appeler Imgflip pour composer le meme
  const params = new URLSearchParams();
  params.append("template_id", templateId);
  params.append("username", username);
  params.append("password", password);
  texts.forEach((text, i) => {
    params.append(`boxes[${i}][text]`, text);
  });

  let imgflipUrl: string;
  try {
    const res = await fetch("https://api.imgflip.com/caption_image", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json();
    if (!data.success) {
      console.error("Imgflip error:", data.error_message);
      return null;
    }
    imgflipUrl = data.data.url;
  } catch (e) {
    console.error("Imgflip fetch error:", e);
    return null;
  }

  // 2. Télécharger l'image composée
  let imageBuffer: Buffer;
  try {
    const imgRes = await fetch(imgflipUrl);
    const arrayBuffer = await imgRes.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);
  } catch (e) {
    console.error("Image download error:", e);
    return null;
  }

  // 3. Traiter l'image avec Sharp
  // On superpose 2 éléments :
  // - Un rectangle qui COUVRE le watermark Imgflip (bas-gauche)
  // - Notre watermark MemeGenius.ai (bas-droite)
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 600;
    const height = metadata.height || 600;

    // Petit badge en bas à gauche — couvre le logo Imgflip et affiche le nôtre
    const barHeight = 16;
    const barWidth = Math.min(130, Math.round(width * 0.22));
    const barSvg = Buffer.from(
      `<svg width="${barWidth}" height="${barHeight}"><rect width="${barWidth}" height="${barHeight}" fill="rgb(0,0,0)"/><text x="${barWidth / 2}" y="${barHeight - 4}" font-family="Arial,Helvetica,sans-serif" font-size="10" font-weight="bold" fill="white" text-anchor="middle">MemeGenius.ai</text></svg>`
    );

    const barPng = await sharp(barSvg).png().toBuffer();

    const finalImage = await sharp(imageBuffer)
      .composite([
        {
          input: barPng,
          top: height - barHeight,
          left: 0,
        },
      ])
      .png()
      .toBuffer();

    const base64 = finalImage.toString("base64");
    return `data:image/png;base64,${base64}`;
  } catch (e) {
    console.error("Sharp processing error:", e);
    return imgflipUrl;
  }
}

// --- System prompt ---
function buildSystemPrompt(templates: ImgflipMeme[]): string {
  // ASTUCE CLÉ : on shuffle les templates à chaque requête
  // pour que Claude ne choisisse pas toujours les premiers de la liste
  const shuffled = [...templates]
    .sort(() => Math.random() - 0.5)
    .slice(0, 50);

  const list = shuffled
    .map((t) => `- "${t.name}" (id:${t.id}, ${t.box_count} boxes)`)
    .join("\n");

  // Choisir un exemple aléatoire (pas Drake !)
  const exampleTemplate = shuffled.find((t) => t.box_count === 2 && t.name !== "Drake Hotline Bling") || shuffled[5];

  return `You are MemeGenius, an expert meme creator with deep knowledge of internet culture.

MISSION: Generate exactly 4 meme variations from the user's idea.

LANGUAGE RULE (CRITICAL):
- Detect the language of the user's prompt
- Generate ALL captions in THAT SAME language
- Template names stay in English (proper nouns)

DIVERSITY RULE (VERY IMPORTANT):
- Each of the 4 memes MUST use a COMPLETELY DIFFERENT template
- DO NOT default to "Drake Hotline Bling" or "Distracted Boyfriend" every time
- Surprise the user! Use lesser-known templates that fit the joke perfectly
- Mix template styles: use at least 1 comparison, 1 reaction, and 1 unexpected format
- Think: "which template would make this joke land the HARDEST?" not "which template is most famous?"

AVAILABLE TEMPLATES (pick from ANY of these):
${list}

RULES:
- "texts" array length MUST exactly match the template's box count
- Captions must be SHORT (max 8 words per box)
- Humor should be relatable, specific, and actually funny

RESPONSE — strict JSON, no markdown, no backticks:
{
  "memes": [
    {
      "template_id": "${exampleTemplate.id}",
      "template_name": "${exampleTemplate.name}",
      "box_count": ${exampleTemplate.box_count},
      "texts": [${Array(exampleTemplate.box_count).fill('"Caption text"').join(", ")}],
      "humor_style": "reaction"
    }
  ]
}

CRITICAL: include "template_id" (the numeric ID string) for each meme. Use 4 DIFFERENT templates.`;
}

// --- Main handler ---
export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.length > 500) {
      return NextResponse.json({ error: "Prompt required (max 500 chars)" }, { status: 400 });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey || anthropicKey.includes("COLLE-TA-CLE")) {
      return NextResponse.json({ error: "Anthropic API key not configured in .env.local" }, { status: 500 });
    }

    const imgflipUser = process.env.IMGFLIP_USERNAME;
    const imgflipPass = process.env.IMGFLIP_PASSWORD;
    if (!imgflipUser || !imgflipPass || imgflipUser === "ton_username_imgflip") {
      return NextResponse.json({
        error: "Imgflip account not configured. Add IMGFLIP_USERNAME and IMGFLIP_PASSWORD to .env.local (free account at imgflip.com/signup)",
      }, { status: 500 });
    }

    // 1. Fetch templates
    const templates = await getTemplates();

    // 2. Claude generates captions
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        temperature: 0.9,
        system: buildSystemPrompt(templates),
        messages: [{ role: "user", content: `Generate 4 memes for: "${prompt}"` }],
      }),
    });

    if (!aiRes.ok) {
      return NextResponse.json({ error: "AI generation error. Try again." }, { status: 502 });
    }

    const aiData = await aiRes.json();
    const text = aiData.content?.[0]?.text || "";
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else return NextResponse.json({ error: "AI format error. Try again!" }, { status: 500 });
    }

    // 3. Compose each meme via Imgflip + rebrand + SAVE
    const memePromises = (parsed.memes || []).map(
      async (m: { template_id: string; template_name: string; texts: string[]; humor_style: string }) => {
        let templateId = m.template_id;
        if (!templateId) {
          const found = templates.find(
            (t) => t.name.toLowerCase() === m.template_name.toLowerCase()
          );
          templateId = found?.id || "181913649";
        }

        // Compose via Imgflip + replace watermark
        const imageDataUrl = await composeMeme(
          templateId,
          m.texts,
          imgflipUser,
          imgflipPass
        );

        // Sauvegarder le meme avec un ID unique
        const memeId = generateMemeId();
        if (imageDataUrl && imageDataUrl.startsWith("data:")) {
          saveMeme(memeId, imageDataUrl, {
            template_name: m.template_name,
            texts: m.texts,
            humor_style: m.humor_style || "unknown",
            prompt: prompt,
          });
        }

        return {
          id: memeId,
          template_name: m.template_name,
          texts: m.texts,
          humor_style: m.humor_style || "unknown",
          image_url: imageDataUrl || "",
          share_url: `/meme/${memeId}`,
        };
      }
    );

    const memes = await Promise.all(memePromises);

    return NextResponse.json({ memes });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
