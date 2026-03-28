"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, FileText } from "lucide-react";
import PlanKPICards from "@/components/advisor/plan-kpi-cards";
import TaxComparison from "@/components/advisor/tax-comparison";
import InsuranceGap from "@/components/advisor/insurance-gap";
import PlanTimeline from "@/components/advisor/plan-timeline";
import Recommendations from "@/components/advisor/recommendations";
import ChatPanel from "@/components/advisor/chat-panel";

interface FinancialPlan {
  summary: string;
  target_corpus: number;
  estimated_retirement_date: string;
  monthly_sip_total: number;
  monthly_plan: any[];
  tax_comparison: any;
  insurance_gap: any;
  portfolio_overlap: any;
  asset_allocation_current: Record<string, number>;
  asset_allocation_target: Record<string, number>;
  key_recommendations: string[];
  educational_notes: string[];
  assumptions: Record<string, any>;
  confidence_notes: string[];
  scenario_type: string;
  disclaimer: string;
}

export default function AdvisorDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [plan, setPlan] = useState<FinancialPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve Clerk → MongoDB user
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/");
      return;
    }

    const resolveUser = async () => {
      // Initialization / Lookup by Clerk ID
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
        }

        if (data.onboarding_completed) {
          setUserId(data.user_id);
        } else {
          // Redirect to onboarding
          router.replace("/onboarding");
        }
      } catch {
        setError("Failed to connect to advisor service");
        setLoading(false);
      }
    };

    resolveUser();
  }, [user, isLoaded, router]);

  // Fetch plan
  const fetchPlan = useCallback(async () => {
    if (!userId) return;
    
    // Set a timeout to cancel polling if component unmounts
    let timeoutId: NodeJS.Timeout;

    try {
      const res = await fetch(`/api/advisor/plan?user_id=${userId}`);
      if (res.status === 404) {
        setError("Generating your personalized financial plan... This usually takes 10-30 seconds.");
        timeoutId = setTimeout(fetchPlan, 5000);
        return;
      }
      
      const data = await res.json();
      if (data.success && data.plan?.plan) {
        setPlan(data.plan.plan);
        setError(null);
        setLoading(false);
      } else {
        setError("Finalizing your plan structure...");
        timeoutId = setTimeout(fetchPlan, 5000);
      }
    } catch {
      setError("Waiting for backend processing to complete...");
      timeoutId = setTimeout(fetchPlan, 5000);
    }

    return () => clearTimeout(timeoutId);
  }, [userId]);

  useEffect(() => {
    let cancel = () => {};
    if (userId) {
      const p = fetchPlan();
      if (p instanceof Promise) {
        p.then(c => { if (c) cancel = c; });
      }
    }
    return () => cancel();
  }, [userId, fetchPlan]);

  // Loading state
  if (loading || !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-sm mx-auto">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <h3 className="font-bold text-lg">Building Your Plan</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {error || "Loading your financial profile..."}
          </p>
        </div>
      </div>
    );
  }

  // Error / no plan state
  if (error || !plan) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <h2 className="text-lg font-semibold">No Financial Plan Yet</h2>
          <p className="text-sm text-muted-foreground">
            {error || "Complete the onboarding to generate your personalized financial plan."}
          </p>
          <button
            onClick={() => router.push("/onboarding")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary 
              text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Plan Header */}
      <div>
        <h1 className="text-2xl font-bold">Your Financial Plan</h1>
        <p className="text-sm text-muted-foreground mt-1">{plan.summary}</p>
      </div>

      {/* KPI Cards */}
      <PlanKPICards plan={plan} />

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Plan details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tax Comparison */}
          <TaxComparison tax={plan.tax_comparison} />

          {/* Monthly Plan Timeline */}
          <PlanTimeline monthlyPlan={plan.monthly_plan} />

          {/* Insurance Gaps */}
          <InsuranceGap insurance={plan.insurance_gap} />

          {/* Recommendations + Educational Notes */}
          <Recommendations
            recommendations={plan.key_recommendations}
            educationalNotes={plan.educational_notes}
            disclaimer={plan.disclaimer}
          />
        </div>

        {/* Right: Chat Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <ChatPanel
              userId={userId!}
              onReplanNeeded={fetchPlan}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
