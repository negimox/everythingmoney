"use client";

import { cn } from "@/lib/utils";

export function Message({
  from,
  children,
}: {
  from: "user" | "assistant";
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex", from === "user" ? "justify-end" : "justify-start")}>
      <div className={cn("w-full", from === "user" ? "max-w-[78%]" : "max-w-[92%]")}>{children}</div>
    </div>
  );
}

export function MessageContent({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

export function MessageResponse({
  from,
  children,
}: {
  from: "user" | "assistant";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
        from === "user"
          ? "bg-primary text-primary-foreground"
          : "border border-border/50 bg-muted/40 text-foreground",
      )}
    >
      {children}
    </div>
  );
}
