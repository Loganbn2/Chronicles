"use client";

import { useEffect, useRef, useState } from "react";
import type { Character, Message, PlayerCharacter, Storyline } from "@/types";
import { storylines } from "@/lib/storylines";

export default function Chat() {
  const [selected, setSelected] = useState<Storyline | undefined>(storylines[0]);
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
      } catch {}
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
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
            messages: [...messages, userMsg],
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
          messages: [...messages, userMsg],
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
    }, [selected?.era]);

    function addTrait(t: string) {
      setForm((f) => ({ ...f, traits: [...(f.traits || []), t] }));
    }

    function addSkill(s: string) {
      setForm((f) => ({ ...f, skills: [...(f.skills || []), s] }));
    }

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
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
          className="input min-h-24"
          placeholder="Background"
          value={form.background}
          onChange={(e) => setForm({ ...form, background: e.target.value })}
        />
        <input
          className="input"
          placeholder="Goals"
          value={form.goals}
          onChange={(e) => setForm({ ...form, goals: e.target.value })}
        />
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Add trait"
            onKeyDown={(e) => {
              const val = (e.target as HTMLInputElement).value.trim();
              if (e.key === "Enter" && val) {
                addTrait(val);
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
          <div className="flex gap-1 flex-wrap">
            {(form.traits || []).map((t, i) => (
              <span key={i} className="badge">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Add skill"
            onKeyDown={(e) => {
              const val = (e.target as HTMLInputElement).value.trim();
              if (e.key === "Enter" && val) {
                addSkill(val);
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
          <div className="flex gap-1 flex-wrap">
            {(form.skills || []).map((s, i) => (
              <span key={i} className="badge">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn"
            onClick={() => setPc(form)}
            title="Use this character"
          >
            Use Character
          </button>
          {pc && (
            <button className="btn-secondary" onClick={() => setPc(null)}>
              Clear
            </button>
          )}
        </div>
      </div>
    );
  }

  function StorylinePicker() {
    return (
      <div className="grid gap-2">
        <label className="text-sm font-medium">Storyline</label>
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
          <p className="text-sm text-muted-foreground">{selected.description}</p>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={streaming}
            onChange={(e) => setStreaming(e.target.checked)}
          />
          Stream responses
        </label>
      </div>
    );
  }

  function NPCList({ chars }: { chars: Character[] }) {
    if (!chars?.length) return null;
    return (
      <div className="grid gap-2">
        <div className="text-sm font-medium">Notable figures</div>
        <div className="flex flex-wrap gap-2">
          {chars.map((c) => (
            <div key={c.id} className="card">
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.role}</div>
              {c.background && (
                <p className="text-sm mt-1 leading-snug">{c.background}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl grid md:grid-cols-3 gap-6 py-8">
      <div className="md:col-span-1 space-y-6">
        <StorylinePicker />
        <div className="grid gap-2">
          <div className="text-sm font-medium">Your Character</div>
          <PcForm />
        </div>
        {selected && <NPCList chars={selected.characters} />}
      </div>

      <div className="md:col-span-2">
        <div className="h-[70vh] overflow-y-auto rounded-lg border p-4 bg-background">
          {messages
            .filter((m) => m.role !== "system")
            .map((m) => (
              <div key={m.id} className="mb-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  {m.role}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              </div>
            ))}
          <div ref={endRef} />
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="input flex-1"
            placeholder="Speak in character..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button className="btn" onClick={send} disabled={loading}>
            {loading ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
