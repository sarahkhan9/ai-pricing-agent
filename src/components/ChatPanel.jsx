import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = "";

export default function ChatPanel({ open, company, seedMessage, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  async function sendChat(nextMessages) {
    setSending(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, messages: nextMessages }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Chat request failed (${res.status}). ${text}`.trim());
      }
      const data = await res.json();
      const reply = data?.reply ?? data?.assistant ?? "";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e?.message || "Failed to chat. Check server logs and your Anthropic API key.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    if (!seedMessage) return;

    // If the panel is freshly opened for a new company/question, seed once.
    if (messages.length === 0) {
      const first = [{ role: "user", content: seedMessage }];
      setMessages(first);
      void sendChat(first);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seedMessage]);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, sending]);

  useEffect(() => {
    if (!open) {
      // Reset panel state when closed so the next seed doesn't get appended incorrectly.
      setMessages([]);
      setInput("");
      setError("");
      setSending(false);
    }
  }, [open]);

  function handleSend() {
    const content = input.trim();
    if (!content) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    void sendChat(next);
  }

  if (!open) return null;

  return (
    <div className="mt-6 bg-gray-950/40 border border-gray-800 rounded-xl overflow-hidden">
      <div className="p-4 flex items-center justify-between gap-3 border-b border-gray-800">
        <div className="min-w-0">
          <div className="font-mono text-xs uppercase tracking-wide text-gray-400">Practice chat</div>
          <div className="mt-1 font-mono text-sm text-yellow-300 truncate">{company}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-xs px-3 py-2 rounded-lg border border-gray-800 hover:border-gray-700 text-gray-200"
        >
          Close
        </button>
      </div>

      <div className="p-4 max-h-[420px] overflow-auto">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-sm font-mono">Waiting for a question...</div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div key={idx} className={isUser ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={[
                      "max-w-[80%] rounded-xl border p-3 text-sm leading-relaxed",
                      isUser
                        ? "bg-gray-900 border-yellow-400/30 text-gray-100"
                        : "bg-gray-950/20 border-gray-800 text-gray-200",
                    ].join(" ")}
                  >
                    <div className="font-mono text-[11px] uppercase tracking-wide text-gray-400">
                      {m.role === "user" ? "You" : "Claude"}
                    </div>
                    <div className="mt-1 whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              );
            })}
            {sending ? (
              <div className="text-gray-500 text-sm font-mono">Claude is thinking...</div>
            ) : null}
            {error ? <div className="text-red-300 text-sm font-mono">{error}</div> : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            disabled={sending}
            className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-sm outline-none text-gray-100 font-mono"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSend) handleSend();
              }
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="bg-gray-900 border border-yellow-400/40 hover:border-yellow-400 rounded-lg px-4 py-3 font-mono text-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <div className="mt-2 text-[11px] text-gray-500 font-mono">
          Tip: answer directly, then ask follow-ups.
        </div>
      </div>
    </div>
  );
}

