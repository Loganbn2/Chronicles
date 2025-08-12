"use client";

import { useEffect, useRef, useState } from "react";
import type { Character, Message, PlayerCharacter, Storyline } from "@/types";
import { storylines } from "@/lib/storylines";
import Link from "next/link";
import Image from "next/image";

export default function Chat({ initialStorylineId, hideStorylinePicker }: { initialStorylineId?: string; hideStorylinePicker?: boolean } = {}) {
  const [selected, setSelected] = useState<Storyline | undefined>(() =>
    storylines.find((s) => s.id === initialStorylineId) ?? storylines[0]
  );
  const [pc, setPc] = useState<PlayerCharacter | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: "system",
      content:
        "You are a collaborative historical fiction narrator and roleplay companion. Keep content PG-13 and respect safety tools.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  type SceneImage = { id: string; url: string; caption?: string; createdAt: number };
  const [sceneImages, setSceneImages] = useState<SceneImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(-1);
  const scenePlaceholders = [
    "/globe.svg",
    "/file.svg",
    "/window.svg",
    "/next.svg",
    "/vercel.svg",
  ];

  const isPortrait = (img?: { caption?: string }) => !!img?.caption?.startsWith("Portrait");
  const latestPortrait = () => {
    for (let i = sceneImages.length - 1; i >= 0; i--) {
      if (isPortrait(sceneImages[i])) return sceneImages[i];
    }
    return null;
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Create a chat on first load
    const init = async () => {
      try {
        const res = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: selected?.title || "Chronicles Chat",
            storylineId: selected?.id,
            pc,
          }),
        });
        const data = await res.json();
        setChatId(data.chat.id as string);
        // Generate initial character portrait if PC exists
        if (pc) {
          await generatePortrait(data.chat.id, selected?.id, pc);
          await hydrateImages(data.chat.id);
        }
      } catch {}
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hydrateImages = async (cid: string) => {
    try {
      const res = await fetch(`/api/chats/${cid}/images`);
      if (!res.ok) return;
      const data: { images: { id: string; url: string; caption: string | null; createdAt: string }[] } = await res.json();
      if (Array.isArray(data.images)) {
        const mapped = data.images.map((i) => ({ id: i.id, url: i.url, caption: i.caption ?? undefined, createdAt: Date.parse(i.createdAt) || Date.now() }));
        setSceneImages(mapped);
        // Focus the last non-portrait image if available; otherwise the last image
        const lastNonPortraitIdx = [...mapped].map((m, idx) => ({ m, idx })).reverse().find(({ m }) => !isPortrait(m))?.idx;
        if (typeof lastNonPortraitIdx === "number") setCurrentImageIndex(lastNonPortraitIdx);
        else setCurrentImageIndex(mapped.length - 1);
      }
    } catch {}
  };

  function addSceneImage(url: string, caption?: string, opts?: { persist?: boolean; focus?: boolean }) {
    setSceneImages((imgs) => {
      const next = [...imgs, { id: crypto.randomUUID(), url, caption, createdAt: Date.now() }];
      const shouldFocus = opts?.focus ?? true;
      if (shouldFocus && !(caption && isPortrait({ caption }))) setCurrentImageIndex(next.length - 1);
      return next;
    });
    const shouldPersist = opts?.persist ?? true;
    if (shouldPersist && chatId) {
      fetch(`/api/chats/${chatId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, caption }),
      }).catch(() => {});
    }
  }

  async function generatePortrait(cid: string, storylineId?: string, pcArg?: PlayerCharacter | null) {
    try {
      const res = await fetch(`/api/chats/${cid}/images/generate-portrait`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storylineId, pc: pcArg }),
      });
      const data = await res.json();
      const url: string = data?.image?.url || "/window.svg";
      const caption: string | undefined = data?.image?.caption || (pcArg?.name ? `Portrait: ${pcArg.name}` : "Portrait");
      // Add locally but don't focus ScenesPanel; hydrate afterward to sync DB state
      addSceneImage(url, caption, { persist: false, focus: false });
    } catch {}
  }

  useEffect(() => {
    // Load existing images for this chat when chatId becomes available
    const loadImages = async () => {
      if (!chatId) return;
      try {
        const res = await fetch(`/api/chats/${chatId}/images`);
        if (!res.ok) return;
        const data: { images: { id: string; url: string; caption: string | null; createdAt: string }[] } = await res.json();
        if (Array.isArray(data.images)) {
          setSceneImages(
            data.images.map((i) => ({ id: i.id, url: i.url, caption: i.caption ?? undefined, createdAt: Date.parse(i.createdAt) || Date.now() }))
          );
          setCurrentImageIndex((prev) => (prev === -1 ? data.images.length - 1 : prev));
        }
      } catch {}
    };
    loadImages();
  }, [chatId]);

  async function saveMessage(id: string, role: Message["role"], content: string) {
    if (!chatId) return;
    try {
      await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: { id, role, content } }),
      });
    } catch {}
  }

  async function maybeCreateSceneImage(userTurnCount: number) {
    if (userTurnCount > 0 && userTurnCount % 5 === 0) {
      const sceneNumber = Math.ceil(userTurnCount / 5);
      const fallbackUrl = scenePlaceholders[(sceneNumber - 1) % scenePlaceholders.length];
      const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
      const caption = lastAssistant ? `Scene ${sceneNumber}: ${lastAssistant.content.slice(0, 80)}...` : `Scene ${sceneNumber}`;

      try {
        if (!chatId) throw new Error("no chat");
        const res = await fetch(`/api/chats/${chatId}/images/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storylineId: selected?.id, caption, lastAssistantText: lastAssistant?.content, pc }),
        });
        if (!res.ok) throw new Error("gen failed");
        const data = await res.json();
        const url: string = data?.image?.url || fallbackUrl;
        // Server already persisted; add locally without persisting again
        addSceneImage(url, caption, { persist: false });
      } catch {
        // Fallback locally and persist
        addSceneImage(fallbackUrl, caption, { persist: true });
      }
    }
  }

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
    const nextMessages = [...messages, userMsg];
    const userTurnCount = nextMessages.filter((m) => m.role === "user").length;
    setMessages((m) => [...m, userMsg]);
    setInput("");
    saveMessage(userMsg.id, "user", userMsg.content);

    if (!streaming) {
      setLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages,
            storylineId: selected?.id,
            playerCharacter: pc,
            chatId,
          }),
        });
        const text = await res.text();
        const reply: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: text,
          timestamp: Date.now(),
        };
        setMessages((m) => [...m, reply]);
        saveMessage(reply.id, "assistant", reply.content);
        // Create a new scene image every 5 user turns
        maybeCreateSceneImage(userTurnCount);
      } catch (e) {
        const err: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, something went wrong.",
          timestamp: Date.now(),
        };
        setMessages((m) => [...m, err]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Streaming branch
    setLoading(true);
    const assistantId = crypto.randomUUID();
    const seed: Message = { id: assistantId, role: "assistant", content: "", timestamp: Date.now() };
    setMessages((m) => [...m, seed]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          storylineId: selected?.id,
          playerCharacter: pc,
          chatId,
        }),
      });

      if (!res.ok || !res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const chunk = acc;
        setMessages((m) => m.map((msg) => (msg.id === assistantId ? { ...msg, content: chunk } : msg)));
      }
      // flush
      acc += new TextDecoder().decode();
      setMessages((m) => m.map((msg) => (msg.id === assistantId ? { ...msg, content: acc } : msg)));
      saveMessage(assistantId, "assistant", acc);
      // Create a new scene image every 5 user turns
      maybeCreateSceneImage(userTurnCount);
    } catch (e) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId ? { ...msg, content: "Sorry, something went wrong." } : msg
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function PcForm() {
    const [form, setForm] = useState<PlayerCharacter>({
      name: "",
      role: "",
      background: "",
      goals: "",
      traits: [],
      era: selected?.era,
      allegiances: "",
      skills: [],
    });

    useEffect(() => {
      setForm((f) => ({ ...f, era: selected?.era }));
    }, [selected?.id]);

    function addTrait(t: string) {
      setForm((f) => ({ ...f, traits: [...(f.traits || []), t] }));
    }

    function addSkill(s: string) {
      setForm((f) => ({ ...f, skills: [...(f.skills || []), s] }));
    }

    const applyCharacter = async () => {
      setPc(form);
      if (chatId) {
        await generatePortrait(chatId, selected?.id, form);
        await hydrateImages(chatId);
      }
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <input
            className="input"
            placeholder="Character name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="input"
            placeholder="Role (e.g., legionary, poet, courtier)"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />
        </div>
        
        <textarea
          className="input"
          placeholder="Character background and history"
          value={form.background}
          onChange={(e) => setForm({ ...form, background: e.target.value })}
          rows={3}
        />
        
        <input
          className="input"
          placeholder="Goals and motivations"
          value={form.goals}
          onChange={(e) => setForm({ ...form, goals: e.target.value })}
        />
        
        <div className="space-y-3">
          <div>
            <label className="font-display text-sm font-semibold text-ink mb-2 block">
              Character Traits
            </label>
            <div className="flex gap-2 mb-2">
              <input
                className="input flex-1"
                placeholder="Add character trait (press Enter)"
                onKeyDown={(e) => {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (e.key === "Enter" && val) {
                    addTrait(val);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.traits || []).map((t, i) => (
                <span key={i} className="badge-secondary text-xs">
                  {t}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <label className="font-display text-sm font-semibold text-ink mb-2 block">
              Skills & Abilities
            </label>
            <div className="flex gap-2 mb-2">
              <input
                className="input flex-1"
                placeholder="Add skill (press Enter)"
                onKeyDown={(e) => {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (e.key === "Enter" && val) {
                    addSkill(val);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.skills || []).map((s, i) => (
                <span key={i} className="badge-secondary text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 pt-4 border-t border-gold/20">
          <button
            className="button flex-1"
            onClick={applyCharacter}
            title="Use this character"
          >
            ⚔ Create Character
          </button>
          {pc && (
            <button 
              className="button-tertiary" 
              onClick={() => setPc(null)}
              title="Clear character"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    );
  }

  function StorylinePicker() {
    return (
      <div className="space-y-4">
        <select
          className="input"
          value={selected?.id}
          onChange={(e) =>
            setSelected(storylines.find((s) => s.id === e.target.value))
          }
        >
          {storylines.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} — {s.era}
            </option>
          ))}
        </select>
        {selected && (
          <div className="p-4 rounded-lg bg-gradient-to-br from-gold/10 to-bronze/10 border border-gold/20">
            <p className="font-garamond text-sm text-ink leading-relaxed">
              {selected.description}
            </p>
            {selected.starterHook && (
              <p className="font-serif text-xs text-bronze/80 italic mt-2">
                "{selected.starterHook}"
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  function NPCList({ chars }: { chars: Character[] }) {
    if (!chars?.length) return null;
    return (
      <div className="space-y-3">
        <h4 className="font-display text-sm font-semibold text-bronze uppercase tracking-wider">
          Historical Figures
        </h4>
        <div className="space-y-3">
          {chars.slice(0, 4).map((c) => (
            <div key={c.id} className="p-3 rounded-lg bg-gradient-to-br from-gold/5 to-bronze/5 border border-gold/20">
              <div className="font-display text-sm font-semibold text-ink">
                {c.name}
              </div>
              <div className="font-garamond text-xs text-bronze italic mb-1">
                {c.role}
              </div>
              {c.background && (
                <p className="font-serif text-xs text-ink-light leading-relaxed">
                  {c.background.length > 120 ? c.background.substring(0, 120) + "..." : c.background}
                </p>
              )}
            </div>
          ))}
          {chars.length > 4 && (
            <p className="text-xs text-bronze/70 font-garamond italic text-center">
              +{chars.length - 4} more characters await your arrival
            </p>
          )}
        </div>
      </div>
    );
  }

  function Sidebar() {
    if (!sidebarOpen) return null;
    
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
        
        {/* Sidebar Panel */}
        <aside className="fixed top-0 right-0 h-full w-96 max-w-[90vw] z-50 animate-slide-in" style={{
          background: `
            linear-gradient(135deg, var(--ivory) 0%, var(--parchment) 50%, var(--parchment-dark) 100%),
            repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(218, 165, 32, 0.02) 20px, rgba(218, 165, 32, 0.02) 40px)
          `,
          borderLeft: "4px solid var(--gold)",
          boxShadow: "-10px 0 40px rgba(0, 0, 0, 0.3)"
        }}>
          <div className="p-8 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-gold/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-bronze flex items-center justify-center">
                  <span className="text-ivory text-sm">⚙</span>
                </div>
                <h2 className="font-display text-xl font-bold text-ink">
                  Character & Settings
                </h2>
              </div>
              <button 
                className="button-tertiary text-sm" 
                onClick={() => setSidebarOpen(false)}
              >
                ✕ Close
              </button>
            </div>

            {/* Storyline Picker (if allowed) */}
            {!initialStorylineId && !hideStorylinePicker && (
              <div className="mb-8">
                <h3 className="font-display text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                  <span className="text-bronze">📜</span>
                  Choose Your Era
                </h3>
                <StorylinePicker />
              </div>
            )}

            {/* Character Section */}
            <div className="mb-8">
              <h3 className="font-display text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                <span className="text-bronze">🎭</span>
                Your Character
              </h3>
              <div className="card" style={{ padding: "1.5rem" }}>
                <PcForm />
              </div>
            </div>

            {/* Settings Section */}
            <div className="mb-8">
              <h3 className="font-display text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                <span className="text-bronze">⚙️</span>
                Preferences
              </h3>
              <div className="card" style={{ padding: "1.5rem" }}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={streaming} 
                    onChange={(e) => setStreaming(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-bronze"
                    style={{ accentColor: "var(--gold)" }}
                  />
                  <div>
                    <span className="font-garamond text-ink font-medium">
                      Stream AI Responses
                    </span>
                    <p className="font-serif text-xs text-bronze/70">
                      Show responses as they are generated
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </aside>
      </>
    );
  }

  function InfoPanel() {
    if (!selected) return null;
    return (
      <div className="card animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bronze to-gold flex items-center justify-center">
            <span className="text-ivory text-sm">🏛️</span>
          </div>
          <h3 className="font-display text-lg font-bold text-ink">
            Era Details
          </h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-display text-sm font-semibold text-bronze uppercase tracking-wider mb-2">
              Time & Place
            </h4>
            <div className="p-3 rounded-lg bg-gradient-to-br from-gold/5 to-bronze/5 border border-gold/20">
              <p className="font-garamond text-sm text-ink font-medium">
                {selected.era}
              </p>
              {selected.location && (
                <p className="font-serif text-xs text-bronze italic">
                  {selected.location}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-display text-sm font-semibold text-bronze uppercase tracking-wider mb-2">
              Historical Context
            </h4>
            <p className="font-garamond text-sm text-ink leading-relaxed">
              {selected.description}
            </p>
          </div>
          
          <NPCList chars={selected.characters} />
        </div>
      </div>
    );
  }

  function PortraitPanel() {
    const portrait = latestPortrait();
    return (
      <div className="card animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-bronze flex items-center justify-center">
            <span className="text-ivory text-sm">🎭</span>
          </div>
          <h3 className="font-display text-lg font-bold text-ink">
            Character Portrait
          </h3>
        </div>
        
        {portrait ? (
          <div>
            <div className="rounded-xl overflow-hidden border-3 border-gold/30 shadow-lg">
              <Image 
                src={portrait.url} 
                alt={portrait.caption || "Character portrait"} 
                width={1024} 
                height={1024} 
                className="w-full h-64 object-cover" 
                unoptimized 
              />
            </div>
            {portrait.caption && (
              <p className="font-garamond text-xs text-bronze italic mt-3 text-center">
                {portrait.caption.replace("Portrait: ", "")}
              </p>
            )}
          </div>
        ) : (
          <div className="h-64 rounded-xl border-2 border-dashed border-gold/30 flex flex-col items-center justify-center bg-gradient-to-br from-gold/5 to-bronze/5">
            <div className="text-4xl mb-2">🎨</div>
            <p className="font-garamond text-sm text-bronze text-center">
              Create a character to generate
              <br />
              their portrait
            </p>
          </div>
        )}
      </div>
    );
  }

  function ScenesPanel() {
    const scenesWithGlobal = sceneImages
      .map((img, idx) => ({ img, idx }))
      .filter(({ img }) => !isPortrait(img));
    const hasScenes = scenesWithGlobal.length > 0;
    const currentSceneEntry = scenesWithGlobal.find((e) => e.idx === currentImageIndex) || scenesWithGlobal.at(-1) || null;
    const current = currentSceneEntry?.img ?? null;

    return (
      <div className="card animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bronze to-gold flex items-center justify-center">
            <span className="text-ivory text-sm">🖼️</span>
          </div>
          <h3 className="font-display text-lg font-bold text-ink">
            Scene Gallery
          </h3>
        </div>
        
        <div className="rounded-xl overflow-hidden border-3 border-gold/30 shadow-lg">
          {current ? (
            <Image 
              src={current.url} 
              alt={current.caption || "Scene image"} 
              width={1024} 
              height={512} 
              className="w-full h-48 object-cover" 
              unoptimized 
            />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center bg-gradient-to-br from-gold/5 to-bronze/5">
              <div className="text-4xl mb-2">🎬</div>
              <p className="font-garamond text-sm text-bronze text-center px-4">
                Scenes will appear as your
                <br />
                story unfolds
              </p>
            </div>
          )}
        </div>
        
        {current && current.caption && (
          <p className="font-garamond text-xs text-bronze italic mt-3">
            {current.caption}
          </p>
        )}
        
        {hasScenes && scenesWithGlobal.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {scenesWithGlobal.map(({ img, idx }) => (
              <button
                key={img.id}
                className={`button-thumbnail flex-shrink-0 ${idx === currentImageIndex ? 'ring-2 ring-gold' : ''}`}
                onClick={() => setCurrentImageIndex(idx)}
                title={img.caption || "Scene image"}
              >
                <Image 
                  src={img.url} 
                  alt={img.caption || "Scene image"} 
                  width={112} 
                  height={64} 
                  className="h-16 w-28 object-cover" 
                  unoptimized 
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const showPicker = !initialStorylineId && !hideStorylinePicker;

  return (
    <div className="min-h-screen bg-gradient-to-br from-parchment via-parchment-dark to-ivory">
      {/* Majestic Header */}
      <header className="relative border-b-4 border-gold shadow-2xl" style={{
        background: `
          linear-gradient(135deg, var(--ivory) 0%, var(--parchment) 30%, var(--parchment-dark) 70%, var(--ivory) 100%),
          repeating-linear-gradient(90deg, transparent, transparent 100px, rgba(218, 165, 32, 0.1) 100px, rgba(218, 165, 32, 0.1) 102px)
        `,
      }}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="header-ornament animate-glow"></div>
              <div>
                <h1 className="font-display text-3xl font-bold text-ink leading-none tracking-wide">
                  {selected?.title || "Chronicles"}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-0.5 w-6 bg-gradient-to-r from-gold to-bronze"></div>
                  <p className="font-garamond text-base text-bronze italic">
                    {selected?.era}{selected?.location ? ` • ${selected.location}` : ""}
                  </p>
                  <div className="h-0.5 w-6 bg-gradient-to-r from-bronze to-gold"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/" className="button-secondary">
                ← Library
              </Link>
              <button className="button" onClick={() => setSidebarOpen(true)}>
                Character & Settings
              </button>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent"></div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Chat Area - Takes up 3/4 of the width */}
          <div className="lg:col-span-3">
            <div className="card" style={{ height: "75vh", display: "flex", flexDirection: "column" }}>
              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto pr-4 space-y-4">
                {messages
                  .filter((m) => m.role !== "system")
                  .map((m) => (
                    <div key={m.id} className="animate-fade-in">
                      <div className={`p-6 rounded-xl border-2 ${
                        m.role === "user" 
                          ? "bg-gradient-to-br from-gold/10 via-gold/5 to-bronze/10 border-gold/30 ml-8"
                          : "bg-gradient-to-br from-ivory to-parchment border-bronze/20 mr-8"
                      } backdrop-blur-sm shadow-lg`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            m.role === "user" 
                              ? "bg-gradient-to-br from-gold to-bronze text-ivory" 
                              : "bg-gradient-to-br from-bronze to-gold text-ivory"
                          }`}>
                            {m.role === "user" ? "You" : "⚜"}
                          </div>
                          <span className="font-display text-sm font-semibold text-bronze uppercase tracking-widest">
                            {m.role === "user" ? "Your Action" : "The Chronicler Speaks"}
                          </span>
                        </div>
                        <div className="font-garamond text-ink text-lg leading-relaxed">
                          {m.content}
                        </div>
                      </div>
                    </div>
                  ))}
                <div ref={endRef} />
              </div>

              {/* Input Area */}
              <div className="border-t-2 border-gold/20 pt-6 mt-6">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <input
                      className="input"
                      placeholder="Speak your character's words and actions..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                      style={{ fontSize: 16, padding: "16px 20px" }}
                    />
                  </div>
                  <button 
                    className="button" 
                    onClick={send} 
                    disabled={loading}
                    style={{ padding: "16px 32px", fontSize: 15 }}
                  >
                    {loading ? "⏳ Thinking..." : "✦ Send"}
                  </button>
                </div>
                <p className="text-xs text-bronze/70 mt-2 font-garamond italic text-center">
                  Press Enter to send • Shift+Enter for new line
                </p>
              </div>
            </div>
          </div>

          {/* Side Panels - Takes up 1/4 of the width */}
          <div className="lg:col-span-1 space-y-6">
            <PortraitPanel />
            <ScenesPanel />
            <InfoPanel />
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      <Sidebar />
    </div>
  );
}
