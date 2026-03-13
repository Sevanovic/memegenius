import { Metadata } from "next";
import { getMeme, memeImageExists } from "@/lib/meme-storage";
import { notFound } from "next/navigation";

// ============================================================
// /meme/[id] — Page de partage virale
//
// C'est LA page qui crée la boucle virale :
// 1. User crée un meme → obtient un lien /meme/abc12345
// 2. Il partage le lien sur X/WhatsApp/Discord
// 3. Le preview OG montre le meme directement dans le chat
// 4. Les gens cliquent → arrivent sur cette page
// 5. Ils voient le meme + un gros CTA "Create yours free"
// 6. Ils créent leur propre meme → cycle recommence
//
// Les OG meta tags sont générés côté serveur (generateMetadata)
// pour que les previews fonctionnent sur TOUTES les plateformes.
// ============================================================

interface PageProps {
  params: Promise<{ id: string }>;
}

// --- OG Meta tags (pour les previews de partage) ---
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const meme = getMeme(id);

  if (!meme) {
    return { title: "Meme not found — MemeGenius" };
  }

  const imageUrl = `/memes/${id}.png`;

  return {
    title: `${meme.template_name} meme — MemeGenius`,
    description: meme.texts.join(" | "),
    openGraph: {
      title: `${meme.template_name} — Made with MemeGenius AI`,
      description: `"${meme.prompt}" → AI generated this meme in 2 seconds`,
      images: [
        {
          url: imageUrl,
          width: 600,
          height: 600,
          alt: meme.texts.join(" - "),
        },
      ],
      type: "website",
      siteName: "MemeGenius",
    },
    twitter: {
      card: "summary_large_image",
      title: `${meme.template_name} — MemeGenius AI`,
      description: meme.texts.join(" | "),
      images: [imageUrl],
    },
  };
}

// --- Page component ---
export default async function MemePage({ params }: PageProps) {
  const { id } = await params;
  const meme = getMeme(id);
  const hasImage = memeImageExists(id);

  if (!meme || !hasImage) {
    notFound();
  }

  const imageUrl = `/memes/${id}.png`;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Header */}
      <header
        className="py-3 px-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 no-underline">
            <span className="text-xl">🎭</span>
            <span
              className="text-lg font-bold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              MemeGenius
            </span>
          </a>
          <a
            href="/"
            className="text-sm px-4 py-2 rounded-lg font-medium no-underline transition-all"
            style={{
              background: "var(--accent)",
              color: "var(--bg-primary)",
            }}
          >
            Create yours free →
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-6 py-10">
        {/* Meme image */}
        <div
          className="rounded-2xl overflow-hidden max-w-lg w-full"
          style={{ border: "1px solid var(--border)" }}
        >
          <img
            src={imageUrl}
            alt={meme.texts.join(" - ")}
            className="w-full h-auto"
          />
        </div>

        {/* Template info */}
        <p
          className="text-sm mt-4"
          style={{ color: "var(--text-muted)" }}
        >
          {meme.template_name} • {meme.humor_style}
        </p>

        {/* CTA */}
        <div
          className="mt-8 p-6 rounded-2xl text-center max-w-md w-full"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-2xl font-bold mb-2"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
            }}
          >
            Make your own meme
          </p>
          <p
            className="text-sm mb-5"
            style={{ color: "var(--text-secondary)" }}
          >
            Describe any idea. AI creates the perfect meme in 2 seconds.
          </p>
          <a
            href="/"
            className="inline-block px-8 py-3 rounded-xl font-semibold text-base
                       no-underline transition-all"
            style={{
              background: "var(--accent)",
              color: "var(--bg-primary)",
            }}
          >
            Create yours free →
          </a>
          <p
            className="text-xs mt-3"
            style={{ color: "var(--text-muted)" }}
          >
            No account needed. 100% free.
          </p>
        </div>

        {/* Original prompt */}
        <div
          className="mt-6 px-4 py-3 rounded-xl max-w-md w-full"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Original prompt:
          </p>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            "{meme.prompt}"
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="text-center py-6"
        style={{
          borderTop: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        <p className="text-xs">
          MemeGenius — AI-powered meme generator. No account. No ads.
        </p>
      </footer>
    </div>
  );
}
