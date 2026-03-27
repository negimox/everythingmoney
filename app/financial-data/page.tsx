"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import DashboardPageLayout from "@/components/dashboard/layout";
import ConsentForm from "@/components/financial/consent-form";
import ConsentStatusTracker from "@/components/financial/consent-status";
import FinancialSummary from "@/components/financial/financial-summary";
import { Landmark, Loader2, RotateCcw } from "lucide-react";
import type { SetuFIDataPayload, FinancialFlowStep } from "@/lib/setu/types";

// Session storage keys for persistence
const STORAGE_KEYS = {
  CONSENT_ID: "setu_consent_id",
  CONSENT_URL: "setu_consent_url",
  SESSION_ID: "setu_session_id",
  FLOW_STEP: "setu_flow_step",
  FI_DATA: "setu_fi_data",
} as const;

function saveState(key: string, value: string | null) {
  if (value) {
    sessionStorage.setItem(key, value);
  } else {
    sessionStorage.removeItem(key);
  }
}

function clearAllState() {
  Object.values(STORAGE_KEYS).forEach((key) =>
    sessionStorage.removeItem(key)
  );
}

export default function FinancialDataPage() {
  const searchParams = useSearchParams();

  const [step, setStep] = useState<FinancialFlowStep>("form");
  const [consentId, setConsentId] = useState<string | null>(null);
  const [consentUrl, setConsentUrl] = useState<string | null>(null);
  const [fiData, setFiData] = useState<SetuFIDataPayload[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const initializedRef = useRef(false);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const consentStatus = searchParams.get("consent_status");
    const storedConsentId = sessionStorage.getItem(STORAGE_KEYS.CONSENT_ID);
    const storedConsentUrl = sessionStorage.getItem(STORAGE_KEYS.CONSENT_URL);
    const storedStep = sessionStorage.getItem(STORAGE_KEYS.FLOW_STEP) as FinancialFlowStep | null;
    const storedFiData = sessionStorage.getItem(STORAGE_KEYS.FI_DATA);
    const storedSessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);

    // Handle redirect back from SETU consent screens
    if (consentStatus === "success" && storedConsentId) {
      setConsentId(storedConsentId);
      setConsentUrl(storedConsentUrl);
      setStep("consent_pending");
      return;
    }

    // Restore: data already loaded and cached
    if (storedStep === "data_loaded" && storedFiData) {
      try {
        const parsed = JSON.parse(storedFiData);
        if (parsed && (Array.isArray(parsed) ? parsed.length > 0 : true)) {
          setFiData(parsed);
          setConsentId(storedConsentId);
          setStep("data_loaded");
          return;
        }
      } catch { /* fall through */ }
    }

    // Restore: data was loaded but FI data not cached (e.g. was empty) — re-fetch from session
    if ((storedStep === "data_loaded" || storedStep === "fetching_data") && storedSessionId) {
      setConsentId(storedConsentId);
      setStep("fetching_data");

      // Re-fetch data from stored session
      (async () => {
        try {
          const dataRes = await fetch(`/api/setu/data?sessionId=${storedSessionId}`);
          const data = await dataRes.json();

          if ((data.status === "COMPLETED" || data.status === "PARTIAL") && data.payload) {
            setFiData(data.payload);
            setStep("data_loaded");
            saveState(STORAGE_KEYS.FLOW_STEP, "data_loaded");
            saveState(STORAGE_KEYS.FI_DATA, JSON.stringify(data.payload));
          } else {
            // Data not available anymore — show form
            setStep("form");
            clearAllState();
          }
        } catch {
          setStep("form");
          clearAllState();
        }
      })();
      return;
    }

    // Restore: consent pending
    if (storedStep === "consent_pending" && storedConsentId && storedConsentUrl) {
      setConsentId(storedConsentId);
      setConsentUrl(storedConsentUrl);
      setStep("consent_pending");
      return;
    }

    // Default: show form
    setStep("form");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConsentCreated = useCallback(
    (id: string, url: string) => {
      setConsentId(id);
      setConsentUrl(url);
      setStep("consent_pending");

      saveState(STORAGE_KEYS.CONSENT_ID, id);
      saveState(STORAGE_KEYS.CONSENT_URL, url);
      saveState(STORAGE_KEYS.FLOW_STEP, "consent_pending");
    },
    []
  );

  const handleConsentApproved = useCallback(async (approvedConsentId: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setStep("fetching_data");
    saveState(STORAGE_KEYS.FLOW_STEP, "fetching_data");

    // Keep retries within consent frequency limit (configured as 2/day on Bridge)
    const MAX_SESSION_RETRIES = 2;
    const POLL_INTERVAL = 5000;
    const MAX_POLLS_PER_SESSION = 12;

    try {
      for (let sessionAttempt = 0; sessionAttempt < MAX_SESSION_RETRIES; sessionAttempt++) {
        if (sessionAttempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        const sessionRes = await fetch("/api/setu/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consentId: approvedConsentId }),
        });

        const sessionData = await sessionRes.json();
        if (!sessionRes.ok) {
          const errMsg = sessionData.error || "";
          if (errMsg.includes("Consent use exceeded")) {
            throw new Error(
              "Daily data fetch limit reached for this consent. " +
              "Please try again tomorrow, or create a new consent request."
            );
          }
          throw new Error(errMsg || "Failed to create data session");
        }

        const sessionId = sessionData.sessionId;
        saveState(STORAGE_KEYS.SESSION_ID, sessionId);

        let sessionFailed = false;

        for (let poll = 0; poll < MAX_POLLS_PER_SESSION; poll++) {
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));

          const dataRes = await fetch(`/api/setu/data?sessionId=${sessionId}`);
          const data = await dataRes.json();

          // Log raw response for debugging
          console.log("[Financial Data] Session poll response:", data);

          if (data.status === "COMPLETED" || data.status === "PARTIAL") {
            const payload = data.payload;
            setFiData(payload || []);
            setStep("data_loaded");

            // Persist loaded data
            saveState(STORAGE_KEYS.FLOW_STEP, "data_loaded");
            if (payload) {
              saveState(STORAGE_KEYS.FI_DATA, JSON.stringify(payload));
            }

            fetchingRef.current = false;
            return;
          }

          if (data.status === "FAILED" || data.status === "EXPIRED") {
            console.warn(
              `Data session ${sessionId} ${data.status}, attempt ${sessionAttempt + 1}/${MAX_SESSION_RETRIES}`
            );
            sessionFailed = true;
            break;
          }
        }

        if (!sessionFailed) {
          console.warn(`Data session ${sessionId} timed out, retrying...`);
        }
      }

      throw new Error(
        "The linked financial institution (FIP) is temporarily unavailable. " +
        "This is common in sandbox environments. Please ensure you link " +
        "accounts from an available FIP (e.g., Setu FIP) during consent approval, " +
        "and try again later."
      );
    } catch (err: any) {
      setError(err.message || "Failed to fetch financial data");
      setStep("error");
      saveState(STORAGE_KEYS.FLOW_STEP, "error");
      fetchingRef.current = false;
    }
  }, []);

  const handleReset = useCallback(() => {
    setStep("form");
    setConsentId(null);
    setConsentUrl(null);
    setFiData(null);
    setError(null);
    fetchingRef.current = false;
    clearAllState();
  }, []);

  return (
    <DashboardPageLayout
      header={{
        title: "Financial Data",
        description: "Fetch your financial data via Account Aggregator",
        icon: Landmark,
      }}
    >
      <div className="max-w-4xl mx-auto py-2">
        {/* Step: Form */}
        {step === "form" && (
          <div className="bg-card/50 rounded-2xl border border-border/40 p-8">
            <ConsentForm onConsentCreated={handleConsentCreated} />
          </div>
        )}

        {/* Step: Consent Pending */}
        {step === "consent_pending" && consentId && consentUrl && (
          <div className="bg-card/50 rounded-2xl border border-border/40 p-8">
            <ConsentStatusTracker
              consentId={consentId}
              consentUrl={consentUrl}
              onConsentApproved={handleConsentApproved}
              onError={(err) => {
                setError(err);
                setStep("error");
              }}
            />
          </div>
        )}

        {/* Step: Fetching Data */}
        {step === "fetching_data" && (
          <div className="bg-card/50 rounded-2xl border border-border/40 p-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">
              Fetching Your Financial Data
            </h2>
            <p className="text-sm text-muted-foreground">
              Please wait while we securely retrieve your financial information
              from your linked accounts...
            </p>
          </div>
        )}

        {/* Step: Data Loaded */}
        {step === "data_loaded" && fiData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Your Financial Overview</h2>
                <p className="text-sm text-muted-foreground">
                  Data fetched via Account Aggregator
                </p>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                New Request
              </button>
            </div>
            <FinancialSummary data={fiData} />
          </div>
        )}

        {/* Step: Error */}
        {step === "error" && (
          <div className="bg-card/50 rounded-2xl border border-border/40 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Something Went Wrong</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {error || "An unexpected error occurred. Please try again."}
            </p>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}
      </div>
    </DashboardPageLayout>
  );
}
