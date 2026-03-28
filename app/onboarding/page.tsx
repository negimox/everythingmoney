"use client";
import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  User,
  Wallet,
  PiggyBank,
  Upload,
  Target,
  Shield,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileUp,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import ConsentForm from "@/components/financial/consent-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────

interface FormData {
  // Step 1: Personal & Goals
  name: string;
  age: number;
  city: string;
  dependents: number;
  primary_goal: string;
  target_retirement_age: number;
  target_monthly_draw: number;
  risk_appetite: string;
  investment_horizon_years: number;

  // Step 2: Income & Tax
  annual_income: number;
  annual_hra_received: number;
  annual_rent_paid: number;
  is_metro_city: boolean;
  existing_ppf: number;
  existing_epf: number;
  existing_nps: number;
  home_loan_interest_annually: number;

  // Step 3: Assets (Manual Fallback)
  existing_mf: number;
  existing_fd: number;
  existing_savings: number;
  current_sip: number;

  // Step 4: Liabilities & Expenses
  monthly_expenses: number;
  home_loan_emi: number;
  car_loan_emi: number;
  other_emi: number;
  has_term_insurance: boolean;
  term_cover_amount: number;
  has_health_insurance: boolean;
  health_cover_amount: number;
}

const INITIAL_DATA: FormData = {
  name: "",
  age: 30,
  city: "India",
  dependents: 0,
  primary_goal: "FIRE",
  target_retirement_age: 60,
  target_monthly_draw: 0,
  risk_appetite: "moderate",
  investment_horizon_years: 10,

  annual_income: 0,
  annual_hra_received: 0,
  annual_rent_paid: 0,
  is_metro_city: true,
  existing_ppf: 0,
  existing_epf: 0,
  existing_nps: 0,
  home_loan_interest_annually: 0,

  existing_mf: 0,
  existing_fd: 0,
  existing_savings: 0,
  current_sip: 0,

  monthly_expenses: 0,
  home_loan_emi: 0,
  car_loan_emi: 0,
  other_emi: 0,
  has_term_insurance: false,
  term_cover_amount: 0,
  has_health_insurance: false,
  health_cover_amount: 0,
};

const STEPS = [
  { title: "Personal & Goals", icon: Target },
  { title: "Income & Tax", icon: Wallet },
  { title: "Assets", icon: PiggyBank },
  { title: "Liabilities & Risk", icon: Shield },
  { title: "Review & Submit", icon: CheckCircle2 },
];

const GOALS = [
  { value: "FIRE", label: "Financial Independence / Early Retirement" },
  { value: "child_education", label: "Child Education Fund" },
  { value: "home_purchase", label: "Home Purchase" },
  { value: "wealth_building", label: "Wealth Building" },
  { value: "retirement", label: "Standard Retirement" },
  { value: "custom", label: "Custom Goal" },
];

const RISK_OPTIONS = [
  {
    value: "conservative",
    label: "Conservative",
    desc: "Prefer stability, accept lower returns",
  },
  { value: "moderate", label: "Moderate", desc: "Balanced risk and returns" },
  {
    value: "aggressive",
    label: "Aggressive",
    desc: "Higher risk for higher returns",
  },
];

// ── Helpers ──────────────────────────────────────────────────

function formatINR(val: number) {
  if (!val) return "₹0";
  return `₹${val.toLocaleString("en-IN")}`;
}

function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  prefix,
  suffix,
  placeholder,
  min,
  max,
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (name: string, value: string | number) => void;
  type?: string;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-muted-foreground/80">
        {label}
      </Label>
      <div className="relative group">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/60 transition-colors group-focus-within:text-primary">
            {prefix}
          </span>
        )}
        <Input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(
              name,
              type === "number" ? Number(e.target.value) : e.target.value,
            )
          }
          placeholder={placeholder}
          min={min}
          max={max}
          className={cn(
            "h-11 bg-muted/30 border-border/50 focus-visible:ring-primary/20",
            prefix && "pl-8",
            suffix && "pr-12",
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Asset Step State
  const [assetTab, setAssetTab] = useState<"setu" | "cas" | "manual">("setu");
  const [casUploading, setCasUploading] = useState(false);
  const [casResult, setCasResult] = useState<any>(null);
  const [setuResult, setSetuResult] = useState<any>(null);

  const router = useRouter();
  const { user, isLoaded } = useUser();

  // ── Onboarding gate ──
  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkOnboarding = async () => {
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
        const apiData = await res.json();

        if (apiData.found && apiData.user_id) {
          localStorage.setItem("advisor_user_id", apiData.user_id);
        }

        if (apiData.onboarding_completed) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        // Backend unreachable — allow onboarding to proceed
      }
      // Pre-fill name if empty
      setData((d) => ({
        ...d,
        name: d.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      }));
      setChecking(false);
    };

    checkOnboarding();
  }, [user, isLoaded, router]);

  const update = useCallback(
    (name: string, value: string | number | boolean) => {
      setData((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  // ── CAS Upload Handler ──
  const handleCASUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Ask for password
    const password = window.prompt(
      "Enter your CAS PDF password (usually your PAN in ALL CAPS):",
    );
    if (!password) {
      alert("Password is required to parse the CAS PDF.");
      return;
    }

    setCasUploading(true);
    setCasResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("password", password);
    formData.append(
      "user_id",
      localStorage.getItem("advisor_user_id") || "temp",
    );

    try {
      const res = await fetch("/api/advisor/parse-cas", {
        method: "POST",
        body: formData,
      });
      const resData = await res.json();
      if (resData.success) {
        setCasResult(resData.data);
      } else {
        alert(resData.detail || "Failed to parse CAS. Check password.");
      }
    } catch (err) {
      alert("Network error. Could not upload CAS.");
    } finally {
      setCasUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  // ── Submission Handler ──
  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const payload = {
        clerk_user_id: user.id,
        ...data,
      };

      const res = await fetch("/api/advisor/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (res.ok) {
        localStorage.setItem("advisor_user_id", responseData.user_id);

        // Let the backend start building the first plan asynchronously
        fetch(`/api/advisor/plan/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: responseData.user_id }),
        }).catch(() => null);

        router.push("/dashboard");
      } else {
        alert("Verification failed. Please try again.");
      }
    } catch (error) {
      alert("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render Steps ──
  const renderStep = () => {
    switch (step) {
      case 0: // Personal & Goals
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField
                label="Full Name"
                name="name"
                value={data.name}
                onChange={update}
                placeholder="John Doe"
              />
              <InputField
                label="Current Age"
                name="age"
                value={data.age}
                onChange={update}
                type="number"
                min={18}
                max={100}
                suffix="yrs"
              />
              <InputField
                label="City"
                name="city"
                value={data.city}
                onChange={update}
                placeholder="Mumbai"
              />
              <InputField
                label="Dependents"
                name="dependents"
                value={data.dependents}
                onChange={update}
                type="number"
                min={0}
                placeholder="0"
              />
            </div>

            <Separator className="opacity-50" />

            <div className="space-y-4">
              <Label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Primary Financial Goal
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOALS.map((g) => {
                  const isSelected = data.primary_goal === g.value;
                  return (
                    <button
                      key={g.value}
                      onClick={() => update("primary_goal", g.value)}
                      className={cn(
                        "rounded-xl border px-5 py-4 text-left text-sm transition-all duration-200 group relative overflow-hidden",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                          : "border-border/60 hover:border-primary/40 hover:bg-muted/30",
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-0 right-0 p-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <span
                        className={cn(
                          "font-medium transition-colors",
                          isSelected ? "text-primary" : "text-foreground/70",
                        )}
                      >
                        {g.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <InputField
                label="Target Retirement Age"
                name="target_retirement_age"
                value={data.target_retirement_age}
                onChange={update}
                type="number"
                min={data.age + 1}
                max={75}
                suffix="years"
              />
              <InputField
                label="Target Monthly Draw"
                name="target_monthly_draw"
                value={data.target_monthly_draw}
                onChange={update}
                type="number"
                prefix="₹"
                suffix="/mo"
              />
              <InputField
                label="Investment Horizon"
                name="investment_horizon_years"
                value={data.investment_horizon_years}
                onChange={update}
                type="number"
                min={1}
                max={40}
                suffix="yrs"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Risk Appetite
              </Label>
              <RadioGroup
                value={data.risk_appetite}
                onValueChange={(val) => update("risk_appetite", val)}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                {RISK_OPTIONS.map((r) => (
                  <div key={r.value}>
                    <RadioGroupItem
                      value={r.value}
                      id={r.value}
                      className="sr-only"
                    />
                    <Label
                      htmlFor={r.value}
                      className={cn(
                        "flex flex-col gap-1 rounded-xl border p-4 cursor-pointer transition-all duration-200 h-full",
                        data.risk_appetite === r.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/60 hover:border-primary/30 hover:bg-muted/30",
                      )}
                    >
                      <span
                        className={cn(
                          "font-semibold text-sm",
                          data.risk_appetite === r.value
                            ? "text-primary"
                            : "text-foreground",
                        )}
                      >
                        {r.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground leading-tight">
                        {r.desc}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case 1: // Income & Tax
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <InputField
                label="Gross Annual Salary"
                name="annual_income"
                value={data.annual_income}
                onChange={update}
                type="number"
                prefix="₹"
              />
              <InputField
                label="Annual HRA Received"
                name="annual_hra_received"
                value={data.annual_hra_received}
                onChange={update}
                type="number"
                prefix="₹"
              />
              <InputField
                label="Annual Rent Paid"
                name="annual_rent_paid"
                value={data.annual_rent_paid}
                onChange={update}
                type="number"
                prefix="₹"
              />
              <div className="flex flex-col justify-center">
                <Label className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-muted/20 cursor-pointer transition-colors hover:bg-muted/30">
                  <input
                    type="checkbox"
                    checked={data.is_metro_city}
                    onChange={(e) => update("is_metro_city", e.target.checked)}
                    className="rounded border-border w-4 h-4 text-primary focus:ring-primary/20"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      Metro City Resident
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Higher HRA tax exemption (50% vs 40%)
                    </span>
                  </div>
                </Label>
              </div>
            </div>

            <Separator className="opacity-50" />

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-wider">
                  Tax Savings (Section 80C / 24)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField
                  label="Current PPF Balance"
                  name="existing_ppf"
                  value={data.existing_ppf}
                  onChange={update}
                  type="number"
                  prefix="₹"
                />
                <InputField
                  label="Current EPF Balance"
                  name="existing_epf"
                  value={data.existing_epf}
                  onChange={update}
                  type="number"
                  prefix="₹"
                />
                <InputField
                  label="Current NPS Balance"
                  name="existing_nps"
                  value={data.existing_nps}
                  onChange={update}
                  type="number"
                  prefix="₹"
                />
                <InputField
                  label="Home Loan Interest (Annual)"
                  name="home_loan_interest_annually"
                  value={data.home_loan_interest_annually}
                  onChange={update}
                  type="number"
                  prefix="₹"
                />
              </div>
            </div>
          </div>
        );

      case 2: // Assets (Three paths)
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Tabs
              value={assetTab}
              onValueChange={(val: any) => setAssetTab(val)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50 p-1 rounded-xl">
                <TabsTrigger
                  value="setu"
                  className="rounded-lg data-[state=active]:shadow-sm"
                >
                  SETU (Auto)
                </TabsTrigger>
                <TabsTrigger
                  value="cas"
                  className="rounded-lg data-[state=active]:shadow-sm"
                >
                  CAS Upload
                </TabsTrigger>
                <TabsTrigger
                  value="manual"
                  className="rounded-lg data-[state=active]:shadow-sm"
                >
                  Manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="setu" className="mt-8">
                <Card className="border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden border-2">
                  <CardContent className="pt-8 pb-10">
                    {setuResult ? (
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-xl text-foreground">
                            Accounts Linked
                          </h4>
                          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            Your portfolios are now securely connected via SETU
                            Account Aggregator.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-md mx-auto">
                        <ConsentForm
                          onConsentCreated={(id, url) => {
                            setTimeout(
                              () => setSetuResult({ success: true }),
                              2000,
                            );
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cas" className="mt-8">
                <Card className="border-border/40 bg-card/30 backdrop-blur-sm border-2">
                  <CardContent className="py-12 flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                      <FileUp className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-xl">
                        Import CAMS/KFintech Statement
                      </h4>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Upload your Consolidated Account Statement (CAS) PDF to
                        automatically parse all your mutual fund holdings.
                      </p>
                    </div>

                    <div className="pt-4">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleCASUpload}
                        id="cas-upload"
                        className="hidden"
                        disabled={casUploading}
                      />
                      <Button
                        asChild
                        size="lg"
                        disabled={casUploading}
                        className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20"
                      >
                        <label
                          htmlFor="cas-upload"
                          className="cursor-pointer flex items-center gap-2"
                        >
                          {casUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {casUploading
                            ? "Parsing Statement..."
                            : "Select CAS PDF"}
                        </label>
                      </Button>
                    </div>

                    {casResult && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-500 animate-in zoom-in-95">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Parsed {casResult.fund_count} schemes (
                        {formatINR(casResult.total_mf_value)})
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="manual" className="mt-8">
                <Card className="border-border/40 bg-card/30 backdrop-blur-sm border-2">
                  <CardContent className="py-8 space-y-8">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                      <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Automatic options are more accurate, but you can
                        manually enter balances below if preferred.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <InputField
                        label="Mutual Funds & Equity"
                        name="existing_mf"
                        value={data.existing_mf}
                        onChange={update}
                        type="number"
                        prefix="₹"
                      />
                      <InputField
                        label="Fixed Deposits / Bonds"
                        name="existing_fd"
                        value={data.existing_fd}
                        onChange={update}
                        type="number"
                        prefix="₹"
                      />
                      <InputField
                        label="Savings & Cash"
                        name="existing_savings"
                        value={data.existing_savings}
                        onChange={update}
                        type="number"
                        prefix="₹"
                      />
                      <InputField
                        label="Current Monthly SIP"
                        name="current_sip"
                        value={data.current_sip}
                        onChange={update}
                        type="number"
                        prefix="₹"
                        suffix="/mo"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        );

      case 3: // Liabilities & Risk
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField
                label="Total Monthly Expenses"
                name="monthly_expenses"
                value={data.monthly_expenses}
                onChange={update}
                type="number"
                prefix="₹"
              />
              <InputField
                label="Home Loan EMI"
                name="home_loan_emi"
                value={data.home_loan_emi}
                onChange={update}
                type="number"
                prefix="₹"
              />
              <InputField
                label="Car Loan EMI"
                name="car_loan_emi"
                value={data.car_loan_emi}
                onChange={update}
                type="number"
                prefix="₹"
              />
              <InputField
                label="Other EMIs / Debt"
                name="other_emi"
                value={data.other_emi}
                onChange={update}
                type="number"
                prefix="₹"
              />
            </div>

            <Separator className="opacity-50" />

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-wider">
                  Insurance Portfolio
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card
                  className={cn(
                    "border-border/40 transition-all cursor-pointer hover:border-primary/30",
                    data.has_term_insurance && "border-primary/50 bg-primary/5",
                  )}
                >
                  <CardContent className="p-5 space-y-4">
                    <Label
                      htmlFor="has-term"
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        id="has-term"
                        checked={data.has_term_insurance}
                        onChange={(e) =>
                          update("has_term_insurance", e.target.checked)
                        }
                        className="rounded border-border w-5 h-5 text-primary focus:ring-primary/20"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">
                          Term Life Cover
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Protection for your family
                        </span>
                      </div>
                    </Label>
                    {data.has_term_insurance && (
                      <div className="animate-in slide-in-from-top-2">
                        <InputField
                          label="Total Sum Assured"
                          name="term_cover_amount"
                          value={data.term_cover_amount}
                          onChange={update}
                          type="number"
                          prefix="₹"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card
                  className={cn(
                    "border-border/40 transition-all cursor-pointer hover:border-primary/30",
                    data.has_health_insurance &&
                      "border-primary/50 bg-primary/5",
                  )}
                >
                  <CardContent className="p-5 space-y-4">
                    <Label
                      htmlFor="has-health"
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        id="has-health"
                        checked={data.has_health_insurance}
                        onChange={(e) =>
                          update("has_health_insurance", e.target.checked)
                        }
                        className="rounded border-border w-5 h-5 text-primary focus:ring-primary/20"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">
                          Health Insurance
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Medical emergency cover
                        </span>
                      </div>
                    </Label>
                    {data.has_health_insurance && (
                      <div className="animate-in slide-in-from-top-2">
                        <InputField
                          label="Total Cover Amount"
                          name="health_cover_amount"
                          value={data.health_cover_amount}
                          onChange={update}
                          type="number"
                          prefix="₹"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case 4: // Review
        return (
          <div className="space-y-6 animate-in fade-in duration-700 pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "Profile & Goals",
                  icon: Target,
                  items: [
                    ["Name", data.name || "—"],
                    ["Age", `${data.age} yrs`],
                    [
                      "Goal",
                      GOALS.find(
                        (g) => g.value === data.primary_goal,
                      )?.label?.split(" / ")[0] || data.primary_goal,
                    ],
                    ["Target Draw", formatINR(data.target_monthly_draw)],
                  ],
                },
                {
                  title: "Tax & Income",
                  icon: Wallet,
                  items: [
                    ["Gross Salary", formatINR(data.annual_income)],
                    [
                      "80C Sav.",
                      formatINR(data.existing_ppf + data.existing_epf),
                    ],
                    ["NPS", formatINR(data.existing_nps)],
                    [
                      "HL Interest",
                      formatINR(data.home_loan_interest_annually),
                    ],
                  ],
                },
                {
                  title: "Expenses",
                  icon: Shield,
                  items: [
                    ["Monthly Exp.", formatINR(data.monthly_expenses)],
                    ["Home EMI", formatINR(data.home_loan_emi)],
                    [
                      "Car/Other",
                      formatINR(data.car_loan_emi + data.other_emi),
                    ],
                    [
                      "Term/Health",
                      data.has_term_insurance || data.has_health_insurance
                        ? "Active"
                        : "None",
                    ],
                  ],
                },
                {
                  title: "Data Source",
                  icon: PiggyBank,
                  items: [
                    [
                      "Asset Link",
                      setuResult
                        ? "SETU (Auto)"
                        : casResult
                          ? "CAS (PDF)"
                          : data.existing_mf > 0
                            ? "Manual"
                            : "None",
                    ],
                    ["Savings", formatINR(data.existing_savings)],
                    [
                      "Portfolio",
                      formatINR(data.existing_mf + data.existing_fd),
                    ],
                    ["Monthly SIP", formatINR(data.current_sip)],
                  ],
                },
              ].map((section) => (
                <Card
                  key={section.title}
                  className="bg-muted/30 border-border/40 shadow-sm transition-all hover:bg-muted/40"
                >
                  <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
                      <section.icon className="w-3.5 h-3.5" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 px-4 pb-4">
                    {section.items.map(([label, val]) => (
                      <div
                        key={label}
                        className="flex justify-between text-sm border-b border-border/30 pb-1.5 last:border-0 last:pb-0"
                      >
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold text-foreground">
                          {val}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-primary/20 bg-primary/5 border-2 mt-4">
              <CardContent className="p-4 flex items-center gap-4 text-sm text-primary">
                <Sparkles className="w-5 h-5 shrink-0" />
                <p className="font-medium">
                  Ready to build your FIRE plan? We'll use these insights to
                  generate a SEBI-compliant roadmap.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const handleNext = () => {
    // Basic validations
    if (step === 0 && (!data.name || !data.age)) {
      alert("Name and age are required.");
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  if (checking) {
    return (
      <div className="flex bg-background h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const CurrentIcon = STEPS[step].icon;

  return (
    <div className="bg-background flex">
      {/* Visual Left Sidebar */}
      <div className="hidden lg:flex w-[380px] xl:w-[450px] flex-col justify-between bg-card border-r border-border p-8 xl:p-12 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none -translate-y-12 translate-x-12">
          <CurrentIcon className="w-96 h-96 blur-sm" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center w-full px-2">
            <Image
              src="/logo.png"
              alt="Everything Money"
              width={160}
              height={40}
              className="h-8 w-auto object-contain group-data-[collapsible=icon]:hidden"
            />
            {/* Small logo for collapsed state */}
            <div className="hidden group-data-[collapsible=icon]:flex size-8 items-center justify-center translate-x-[4px]">
              <Image
                src="/logo-small.png"
                alt="E"
                width={32}
                height={32}
                className="size-8 object-contain"
              />
            </div>
          </div>
          <div className="space-y-7 mt-8">
            {STEPS.map((s, idx) => {
              const active = idx === step;
              const past = idx < step;
              const StepIcon = s.icon;
              return (
                <div
                  key={s.title}
                  className={cn(
                    "flex items-center gap-5 transition-all duration-500",
                    active
                      ? "opacity-100 translate-x-2"
                      : past
                        ? "opacity-80 scale-95"
                        : "opacity-30 scale-90",
                  )}
                >
                  <div
                    className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      active
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-primary/20"
                        : past
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {past ? (
                      <CheckCircle2 className="w-6 h-6 shrink-0" />
                    ) : (
                      <StepIcon className="w-5 h-5 shrink-0" />
                    )}
                  </div>
                  <div>
                    <h3
                      className={`text-sm ${active ? "text-foreground font-semibold" : "text-foreground font-medium"}`}
                    >
                      {s.title}
                    </h3>
                    {active && (
                      <p className="text-xs text-primary font-medium mt-1 uppercase tracking-wider">
                        Current step
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 text-xs text-muted-foreground/60 leading-relaxed max-w-[320px]">
          Everything Money is a SEBI Compliant Investment Advisor. By
          continuing, you authorize us to securely analyze your data.
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-background/50 selection:bg-primary/20">
        <div className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-12 lg:p-16 flex flex-col justify-center min-h-max">
          {/* Mobile Header */}
          <div className="lg:hidden mb-10">
            <div className="flex items-center justify-center w-full px-2">
              <Image
                src="/logo.png"
                alt="Everything Money"
                width={160}
                height={40}
                className="h-8 w-auto object-contain group-data-[collapsible=icon]:hidden"
              />
              {/* Small logo for collapsed state */}
              <div className="hidden group-data-[collapsible=icon]:flex size-8 items-center justify-center translate-x-[4px]">
                <Image
                  src="/logo-small.png"
                  alt="E"
                  width={32}
                  height={32}
                  className="size-8 object-contain"
                />
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CurrentIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 opacity-80">
                    Step {step + 1} of {STEPS.length}
                  </p>
                  <h1 className="text-2xl font-bold font-display text-foreground leading-none">
                    {STEPS[step].title}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-primary/40" />
              <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">
                Step {step + 1} of {STEPS.length}
              </p>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold font-display tracking-tight text-foreground leading-[1.1]">
              {STEPS[step].title}
            </h1>
          </div>

          <div className="w-full">{renderStep()}</div>

          {/* Navigation */}
          <div className="mt-14 flex items-center justify-between pt-8 border-t border-border/50">
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={step === 0 || loading}
              className={cn(
                "h-12 px-6 rounded-xl transition-all duration-300",
                step === 0 ? "opacity-0 pointer-events-none" : "opacity-100",
              )}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              size="lg"
              onClick={step === STEPS.length - 1 ? handleSubmit : handleNext}
              disabled={loading}
              className="h-12 px-10 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : step === STEPS.length - 1 ? (
                "Complete Setup"
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
