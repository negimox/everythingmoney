"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
  type AttachmentFile,
} from "@/components/ai-elements/attachments";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Reasoning } from "@/components/ai-elements/reasoning";
import { Task, TaskItem } from "@/components/ai-elements/task";
import { Tool } from "@/components/ai-elements/tool";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  triggered_replan?: boolean;
  attachments?: AttachmentFile[];
}

interface ChatPanelProps {
  userId: string;
  onReplanNeeded?: () => void;
  fullHeight?: boolean;
}

function PromptInputAttachmentsDisplay({
  compact = false,
}: {
  compact?: boolean;
}) {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) return null;
  return (
    <Attachments variant="inline" className={compact ? "px-1" : undefined}>
      {attachments.files.map((file) => (
        <Attachment
          key={file.id}
          data={file}
          onRemove={() => attachments.remove(file.id)}
        >
          <AttachmentPreview data={file} />
          <AttachmentInfo data={file} />
          <AttachmentRemove onRemove={() => attachments.remove(file.id)} />
        </Attachment>
      ))}
    </Attachments>
  );
}

function HeroComposer({ loading }: { loading: boolean }) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-5 text-left">
        <p className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight text-foreground">
          <Sparkles className="h-6 w-6 text-primary" />
          Where should we start?
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask about retirement, taxes, SIP allocation, or profile updates.
        </p>
      </div>

      <div className="rounded-2xl border border-border/50 bg-background/70 shadow-[0_8px_40px_-20px_rgba(0,0,0,0.7)] backdrop-blur">
        <PromptInputHeader className="border-b-0 pb-0">
          <PromptInputAttachmentsDisplay compact />
        </PromptInputHeader>
        <PromptInputBody className="pt-2">
          <PromptInputTextarea
            placeholder="Ask your financial co-pilot..."
            disabled={loading}
            className="min-h-[72px] text-base"
          />
        </PromptInputBody>
        <PromptInputFooter className="border-t-0 pt-0">
          <PromptInputTools>
            <PromptInputActionAddAttachments />
          </PromptInputTools>
          <PromptInputSubmit loading={loading} />
        </PromptInputFooter>
      </div>
    </div>
  );
}

export default function ChatPanel({
  userId,
  onReplanNeeded,
  fullHeight = false,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [replanning, setReplanning] = useState(false);
  const [openReasoning, setOpenReasoning] = useState<Record<number, boolean>>(
    {},
  );
  const [openTool, setOpenTool] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const showConversation = messages.length > 0;

  useEffect(() => {
    const cacheKey = `advisor-chat-cache:${userId}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as ChatMessage[];
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch (err) {
      console.error("Failed to load local chat cache:", err);
    }

    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/advisor/chat/history?user_id=${userId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setMessages((prev) =>
            data.messages.length === 0 && prev.length > 0
              ? prev
              : data.messages,
          );
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };
    if (userId) loadHistory();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem(
        `advisor-chat-cache:${userId}`,
        JSON.stringify(messages),
      );
    } catch (err) {
      console.error("Failed to persist local chat cache:", err);
    }
  }, [messages, userId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, replanning]);

  const sendMessage = async (message: PromptInputMessage) => {
    const text = message.text?.trim() || "";
    const hasText = Boolean(text);
    const hasFiles = Boolean(message.files?.length);
    if ((!hasText && !hasFiles) || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: text || "Sent with attachments",
      attachments: message.files || [],
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, message: userMessage.content }),
      });
      const data = await res.json();
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.reply || "Sorry, I couldn't process that.",
        triggered_replan: data.needs_replan,
      };
      setMessages((prev) => [...prev, assistantMessage]);

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
        } finally {
          setReplanning(false);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`w-full min-w-0 flex flex-col ${fullHeight ? "h-full" : "h-150"}`}
    >
      {showConversation ? (
        <div className="relative flex-1 min-h-0">
          {replanning && (
            <div className="absolute right-4 top-2 z-10 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-400">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Updating plan...
            </div>
          )}

          <div ref={scrollRef} className="relative flex-1 min-h-0 h-full">
            <Conversation>
              <ConversationContent className="pt-4">
                {messages.map((msg, i) => (
                  <Message from={msg.role} key={`${msg.role}-${i}`}>
                    <MessageContent>
                      <MessageResponse from={msg.role}>
                        {msg.content}
                      </MessageResponse>

                      {msg.attachments && msg.attachments.length > 0 && (
                        <Attachments variant="inline">
                          {msg.attachments.map((file) => (
                            <Attachment key={file.id} data={file}>
                              <AttachmentPreview data={file} />
                              <AttachmentInfo data={file} />
                            </Attachment>
                          ))}
                        </Attachments>
                      )}

                      {msg.role === "assistant" && (
                        <>
                          <Reasoning
                            open={Boolean(openReasoning[i])}
                            onToggle={() =>
                              setOpenReasoning((prev) => ({
                                ...prev,
                                [i]: !prev[i],
                              }))
                            }
                            isStreaming={loading && i === messages.length - 1}
                          >
                            Profile loaded, intent classified, financial context
                            reviewed, and recommendation generated from the
                            latest user profile.
                          </Reasoning>

                          <Task title="Agent Progress">
                            <TaskItem
                              label="Read profile and chat context"
                              status="completed"
                            />
                            <TaskItem
                              label="Run financial reasoning"
                              status={
                                loading && i === messages.length - 1
                                  ? "in_progress"
                                  : "completed"
                              }
                            />
                            <TaskItem
                              label="Return response and replan signal"
                              status={
                                msg.triggered_replan ? "completed" : "pending"
                              }
                            />
                          </Task>

                          <Tool
                            title="Tool invocation details"
                            open={Boolean(openTool[i])}
                            onToggle={() =>
                              setOpenTool((prev) => ({
                                ...prev,
                                [i]: !prev[i],
                              }))
                            }
                          >
                            Backend currently returns `reply`, `needs_replan`,
                            and `profile_updates`. Per-tool traces are not
                            exposed yet.
                          </Tool>
                        </>
                      )}
                    </MessageContent>
                  </Message>
                ))}
              </ConversationContent>
              <ConversationScrollButton
                onClick={() =>
                  scrollRef.current?.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: "smooth",
                  })
                }
              />
            </Conversation>
          </div>

          <div className="p-3">
            <PromptInput
              onSubmit={sendMessage}
              className="w-full rounded-xl border border-border/40 bg-background/70"
            >
              <PromptInputHeader className="border-b-0 pb-0">
                <PromptInputAttachmentsDisplay compact />
              </PromptInputHeader>
              <PromptInputBody className="pt-2">
                <PromptInputTextarea
                  placeholder="Continue the conversation..."
                  disabled={loading}
                  className="min-h-[52px]"
                />
              </PromptInputBody>
              <PromptInputFooter className="border-t-0 pt-0">
                <PromptInputTools>
                  <PromptInputActionAddAttachments />
                </PromptInputTools>
                <PromptInputSubmit loading={loading} />
              </PromptInputFooter>
            </PromptInput>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              AI can make mistakes. Always review recommendations before taking
              action.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center px-4">
          <PromptInput
            onSubmit={sendMessage}
            className="w-full border-none bg-transparent shadow-none"
          >
            <HeroComposer loading={loading} />
          </PromptInput>
        </div>
      )}
    </div>
  );
}
