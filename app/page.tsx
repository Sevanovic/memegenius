"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ============================================================
// MemeGenius v6 — Imgflip-rendered memes
//
// CHANGEMENT MAJEUR : plus de Canvas !
// Les memes sont composés par Imgflip côté serveur.
// On affiche juste des <img> avec les URLs retournées.
// Le positionnement est PARFAIT pour chaque template.
// ============================================================

const SUGGESTIONS = [
  { emoji: "💻", text: "developers on Monday morning" },
  { emoji: "🔄", text: "when the client changes the brief again" },
  { emoji: "🤖", text: "AI is going to replace my job" },
  { emoji: "📧", text: "meetings that could have been an email" },
  { emoji: "🍕", text: "pineapple on pizza debate" },
  { emoji: "😴", text: "my productivity Sunday vs Monday" },
  { emoji: "🇫🇷", text: "les développeurs le lundi matin" },
  { emoji: "💰", text: "expliquer la crypto à mes parents" },
];

interface GeneratedMeme {
  id: string;
  template_name: string;
  texts: string[];
  humor_style: string;
  image_url: string;
  share_url: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [memes, setMemes] = useState<GeneratedMeme[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [memeCount, setMemeCount] = useState(0);
  const previewRef = useRef<HTMLImageElement>(null);

  const selected = memes[selectedIndex] || null;
  const hasResults = memes.length > 0;
  const getImageUrl = (meme: GeneratedMeme) => meme.image_url;

  useEffect(() => {
    setMemeCount(parseInt(localStorage.getItem("mg_count") || "0"));
  }, []);

  async function generate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
    setMemes([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setMemes(data.memes);
      setSelectedIndex(0);
      const nc = memeCount + data.memes.length;
      setMemeCount(nc);
      localStorage.setItem("mg_count", nc.toString());
    } catch {
      setError("Network error — check your connection");
    } finally {
      setLoading(false);
    }
  }

  // Télécharger en PNG via un canvas intermédiaire (pour convertir l'URL en fichier local)
  const downloadPNG = useCallback(async () => {
    const img = previewRef.current;
    if (!img) return;
    try {
      // Fetch l'image comme blob pour éviter les problèmes CORS
      const res = await fetch(img.src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `memegenius-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: ouvrir dans un nouvel onglet
      window.open(img.src, "_blank");
    }
  }, []);

  const copyToClipboard = useCallback(async () => {
    const img = previewRef.current;
    if (!img) return;
    try {
      const res = await fetch(img.src);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      downloadPNG();
    }
  }, [downloadPNG]);

  const copyShareLink = useCallback(() => {
    if (!selected) return;
    const url = `${window.location.origin}${selected.share_url}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [selected]);

  const shareToX = useCallback(() => {
    if (!selected) return;
    const url = `${window.location.origin}${selected.share_url}`;
    const t = encodeURIComponent(`Made with MemeGenius AI 🔥\n${url}`);
    window.open(`https://twitter.com/intent/tweet?text=${t}`, "_blank");
  }, [selected]);

  return (
    <div className="min-h-screen relative" style={{ zIndex: 1 }}>
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md"
        style={{ background: "rgba(10,10,15,0.8)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎭</span>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              MemeGenius
            </span>
          </div>
          <div className="flex items-center gap-3">
            {memeCount > 0 && (
              <span className="text-xs px-3 py-1 rounded-full"
                style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                {memeCount} memes
              </span>
            )}
            <span className="text-xs px-3 py-1 rounded-full"
              style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              100+ templates
            </span>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <div className="text-center mb-12 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="inline-block text-xs font-medium px-3 py-1.5 rounded-full mb-6"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-glow)" }}>
            AI-powered — 100+ templates — Any language
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight"
            style={{ fontFamily: "var(--font-display)" }}>
            Your idea. <span style={{ color: "var(--accent)" }}>4 memes.</span>
            <br />In 2 seconds.
          </h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Describe your meme in any language. AI picks the perfect template
            and writes the caption.
          </p>
        </div>

        {/* INPUT */}
        <div className="max-w-2xl mx-auto mb-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex gap-2 p-2 rounded-2xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <input type="text" value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder="Describe your meme idea..."
              className="flex-1 px-4 py-3 bg-transparent text-lg outline-none placeholder-[var(--text-muted)]"
              style={{ color: "var(--text-primary)" }} />
            <button onClick={generate} disabled={loading || !prompt.trim()}
              className="px-8 py-3 rounded-xl font-semibold text-base transition-all whitespace-nowrap disabled:opacity-30"
              style={{ background: loading ? "var(--bg-elevated)" : "var(--accent)", color: loading ? "var(--text-secondary)" : "var(--bg-primary)" }}>
              {loading ? "Generating..." : "Generate →"}
            </button>
          </div>
        </div>

        {/* SUGGESTIONS */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          {SUGGESTIONS.map((s) => (
            <button key={s.text} onClick={() => setPrompt(s.text)}
              className="px-3 py-1.5 text-sm rounded-full transition-all"
              style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
              {s.emoji} {s.text}
            </button>
          ))}
        </div>

        {/* STATS */}
        {!hasResults && !loading && (
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto animate-fade-up" style={{ animationDelay: "0.4s" }}>
            {[{ v: "100+", l: "meme templates" }, { v: "<3s", l: "generation" }, { v: "🌍", l: "any language" }].map((s) => (
              <div key={s.l} className="text-center p-4 rounded-xl"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}>{s.v}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.l}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ERROR */}
      {error && (
        <div className="max-w-2xl mx-auto px-6 mb-8">
          <div className="p-4 rounded-xl text-center text-sm"
            style={{ background: "#ff475720", border: "1px solid #ff475740", color: "var(--danger)" }}>
            {error}
          </div>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="max-w-3xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-square rounded-xl shimmer" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      )}

      {/* RESULTS */}
      {hasResults && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* THUMBNAILS */}
            <div className="lg:col-span-2">
              <p className="text-sm font-medium mb-3" style={{ color: "var(--text-muted)" }}>
                4 variations — click to select
              </p>
              <div className="grid grid-cols-2 gap-3">
                {memes.map((meme, i) => (
                  <button key={i} onClick={() => setSelectedIndex(i)}
                    className="rounded-xl overflow-hidden transition-all"
                    style={{
                      border: i === selectedIndex ? "2px solid var(--accent)" : "2px solid var(--border)",
                      boxShadow: i === selectedIndex ? "0 0 20px var(--accent-dim)" : "none",
                    }}>
                    {/* IMAGE COMPOSÉE PAR IMGFLIP — positionnement parfait ! */}
                    <img
                      src={getImageUrl(meme)}
                      alt={meme.template_name}
                      className="w-full h-auto"
                      loading="lazy"
                    />
                    <div className="px-3 py-2"
                      style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)" }}>
                      <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {meme.template_name}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{meme.humor_style}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* PREVIEW */}
            <div className="lg:col-span-3">
              {selected && (
                <>
                  <p className="text-sm font-medium mb-3" style={{ color: "var(--text-muted)" }}>
                    Preview — {selected.template_name}
                  </p>
                  <div className="rounded-2xl overflow-hidden"
                    style={{ border: "1px solid var(--border)" }}>
                    <img
                      ref={previewRef}
                      src={getImageUrl(selected)}
                      alt={selected.template_name}
                      className="w-full h-auto"
                      crossOrigin="anonymous"
                    />
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-3 mt-4">
                    <button onClick={downloadPNG}
                      className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                      style={{ background: "var(--accent)", color: "var(--bg-primary)" }}>
                      ⬇ Download
                    </button>
                    <button onClick={copyShareLink}
                      className="px-5 py-3 rounded-xl font-medium transition-all"
                      style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                      {linkCopied ? "✅ Link copied!" : "🔗 Copy link"}
                    </button>
                    <button onClick={shareToX}
                      className="px-5 py-3 rounded-xl font-medium transition-all"
                      style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                      𝕏 Share
                    </button>
                  </div>

                  {/* SHARE URL PREVIEW */}
                  {selected.share_url && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>🔗</span>
                      <code className="text-xs flex-1 truncate" style={{ color: "var(--accent)" }}>
                        {typeof window !== "undefined" ? window.location.origin : ""}{selected.share_url}
                      </code>
                      <button onClick={copyShareLink}
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                        {linkCopied ? "✅" : "Copy"}
                      </button>
                    </div>
                  )}

                  {/* CAPTIONS (read-only, shows what was generated) */}
                  <div className="mt-4 p-4 rounded-xl"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <p className="text-sm font-medium mb-3">
                      📝 Generated captions
                    </p>
                    {selected.texts.map((text, i) => (
                      <div key={i} className="flex items-center gap-3 mb-2">
                        <span className="text-xs min-w-[50px] font-mono px-2 py-1.5 rounded text-center"
                          style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                          {i + 1}
                        </span>
                        <p className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>
                          {text}
                        </p>
                      </div>
                    ))}
                    <p className="text-[11px] mt-3" style={{ color: "var(--text-muted)" }}>
                      💡 To edit captions, modify your prompt and regenerate.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* EMPTY */}
      {!loading && !hasResults && !error && (
        <div className="text-center py-8 animate-fade-up" style={{ animationDelay: "0.5s" }}>
          <p className="text-5xl mb-3 opacity-20">🎯</p>
        </div>
      )}

      {/* FOOTER */}
      <footer className="text-center py-8" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
        <p className="text-xs">MemeGenius — AI-powered meme generator. No account needed. No ads. Just memes.</p>
      </footer>
    </div>
  );
}
