"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ChatPanel from "@/components/advisor/chat-panel";
import { useDashboardView } from "@/components/advisor/dashboard-context";

export default function AdvisorChatPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { setActiveView } = useDashboardView();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/");
      return;
    }

    const resolveUser = async () => {
      try {
        const payload = {
          clerk_user_id: user.id,
          email: user.primaryEmailAddress?.emailAddress || "",
          first_name: user.firstName || "",
          last_name: user.lastName || "",
        };
        const res = await fetch(`/api/advisor/user/init`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (data.found && data.user_id) {
          localStorage.setItem("advisor_user_id", data.user_id);
          setUserId(data.user_id);
          setLoading(false);
        } else if (!data.onboarding_completed) {
          router.replace("/onboarding");
        } else {
          setUserId(data.user_id);
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    };

    resolveUser();
  }, [user, isLoaded, router]);

  useEffect(() => {
    setActiveView("chat");
  }, [setActiveView]);

  if (loading || !isLoaded || !userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full h-full min-w-0 flex flex-col">
      <ChatPanel userId={userId} onReplanNeeded={() => {}} fullHeight />
    </div>
  );
}
