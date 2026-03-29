"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, RefreshCw } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  triggered_replan?: boolean;
}

interface ChatPanelProps {
  userId: string;
  onReplanNeeded?: () => void;
  fullHeight?: boolean;
}

export default function ChatPanel({
  userId,
  onReplanNeeded,
  fullHeight = false,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [replanning, setReplanning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/advisor/chat/history?user_id=${userId}`);
        const data = await res.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };
    if (userId) loadHistory();
  }, [userId]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, message: userMessage.content }),
      });
      const data = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply || "Sorry, I couldn't process that.",
        triggered_replan: data.needs_replan,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // If profile changed, trigger replan
      if (data.needs_replan) {
        setReplanning(true);
        try {
          const planForm = new FormData();
          planForm.append("user_id", userId);
          await fetch("/api/advisor/plan/regenerate", {
            method: "POST",
            body: planForm,
          });
          onReplanNeeded?.();
        } catch (err) {
          console.error("Replan failed:", err);
        } finally {
          setReplanning(false);
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-xl border border-border/50 bg-card flex flex-col ${fullHeight ? "h-full" : "h-[500px]"}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Financial Advisor</span>
        </div>
        {replanning && (
          <span className="flex items-center gap-1.5 text-xs text-amber-400">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Updating plan...
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="w-10 h-10 mb-3 text-primary/30" />
            <p className="text-sm font-medium">
              Ask me anything about your finances
            </p>
            <p className="text-xs mt-1">
              Try: &quot;What if I retire at 55?&quot; or &quot;How can I save
              more tax?&quot;
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                msg.role === "user" ? "bg-primary/10" : "bg-muted"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60"
              }`}
            >
              {msg.content}
              {msg.triggered_replan && (
                <p className="mt-2 pt-2 border-t border-amber-500/20 text-xs text-amber-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Plan updated based on this change
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="bg-muted/60 rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/30">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask about your financial plan..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center
              hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          AI-generated guidance, not licensed financial advice
        </p>
      </div>
    </div>
  );
}
