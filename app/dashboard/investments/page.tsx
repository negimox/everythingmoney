"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Loader2,
  TrendingUp,
  Building2,
  Wallet,
  Coins,
  Info,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TradingViewWidget from "@/components/advisor/tradingview-widget";
import DashboardPageLayout from "@/components/dashboard/layout";

interface FundRecommendation {
  name: string;
  isin?: string;
  category?: string;
  amc?: string;
  risk_level?: string;
  expense_ratio_pct?: number;
  aum_cr?: number;
  returns_1y_pct?: number;
  returns_3y_pct?: number;
  returns_5y_pct?: number;
  expected_return_pct?: number;
  min_sip_amount?: number;
  rating?: number;
}

interface MonthlyEntry {
  month: string;
  sip_large_cap: number;
  sip_mid_cap: number;
  sip_small_cap: number;
  sip_debt: number;
  sip_gold: number;
  large_cap_funds?: FundRecommendation[];
  mid_cap_funds?: FundRecommendation[];
  small_cap_funds?: FundRecommendation[];
  debt_funds?: FundRecommendation[];
  gold_funds?: FundRecommendation[];
}

interface FinancialPlan {
  monthly_plan: MonthlyEntry[];
  asset_allocation_target: Record<string, number>;
}

function formatINR(val: number): string {
  if (!val) return "—";
  if (val >= 10000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toLocaleString("en-IN")}`;
}

function getRiskColor(risk: string | undefined): string {
  switch (risk?.toLowerCase()) {
    case "low":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "moderate":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "moderately_high":
      return "bg-orange-500/10 text-orange-400 border-orange-500/30";
    case "high":
      return "bg-red-500/10 text-red-400 border-red-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function FundCard({
  fund,
  sipAmount,
}: {
  fund: FundRecommendation;
  sipAmount?: number;
}) {
  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle
              className="text-sm font-medium line-clamp-2"
              title={fund.name}
            >
              {fund.name}
            </CardTitle>
            {fund.amc && (
              <CardDescription className="text-xs mt-0.5">
                {fund.amc}
              </CardDescription>
            )}
          </div>
          {fund.rating && (
            <div className="flex items-center gap-0.5 shrink-0">
              {[...Array(fund.rating)].map((_, i) => (
                <span key={i} className="text-amber-400 text-xs">
                  ★
                </span>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Risk Badge & ISIN */}
        <div className="flex items-center gap-2 flex-wrap">
          {fund.risk_level && (
            <Badge
              variant="outline"
              className={`text-xs capitalize ${getRiskColor(fund.risk_level)}`}
            >
              {fund.risk_level.replace(/_/g, " ")}
            </Badge>
          )}
          {fund.isin && (
            <span className="text-xs text-muted-foreground font-mono">
              {fund.isin}
            </span>
          )}
        </div>

        {/* Returns Grid */}
        <div className="grid grid-cols-3 gap-2 text-center py-2 bg-muted/30 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">1Y Return</p>
            <p
              className={`text-sm font-semibold ${(fund.returns_1y_pct || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {fund.returns_1y_pct != null ? `${fund.returns_1y_pct}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">3Y Return</p>
            <p
              className={`text-sm font-semibold ${(fund.returns_3y_pct || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {fund.returns_3y_pct != null ? `${fund.returns_3y_pct}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">5Y Return</p>
            <p
              className={`text-sm font-semibold ${(fund.returns_5y_pct || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {fund.returns_5y_pct != null ? `${fund.returns_5y_pct}%` : "—"}
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Expense:{" "}
            {fund.expense_ratio_pct != null
              ? `${fund.expense_ratio_pct}%`
              : "—"}
          </span>
          <span>
            Min SIP:{" "}
            {fund.min_sip_amount ? formatINR(fund.min_sip_amount) : "—"}
          </span>
        </div>

        {/* SIP Amount */}
        {sipAmount && sipAmount > 0 && (
          <div className="pt-2 border-t border-border/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Recommended SIP
              </span>
              <span className="text-base font-bold text-primary">
                {formatINR(sipAmount)}/mo
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryTab({
  title,
  description,
  icon: Icon,
  funds,
  sipAmount,
  color,
  tradingViewSymbol,
}: {
  title: string;
  description: string;
  icon: any;
  funds: FundRecommendation[];
  sipAmount: number;
  color: string;
  tradingViewSymbol?: string;
}) {
  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-display">
            {formatINR(sipAmount)}
          </p>
          <p className="text-xs text-muted-foreground">Monthly Allocation</p>
        </div>
      </div>

      {/* TradingView Chart */}
      {tradingViewSymbol && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Market Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            <TradingViewWidget symbol={tradingViewSymbol} height={250} />
          </CardContent>
        </Card>
      )}

      {/* Fund Cards */}
      <div>
        <h3 className="text-sm font-medium mb-3">
          Recommended Funds ({funds.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {funds.map((fund, i) => (
            <FundCard
              key={fund.isin || i}
              fund={fund}
              sipAmount={i === 0 ? sipAmount : undefined}
            />
          ))}
        </div>
      </div>

      {/* Educational Note */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary">Investment Note</p>
            <p className="text-xs text-muted-foreground mt-1">
              These are educational recommendations based on your risk profile.
              Past returns don&apos;t guarantee future performance. Consider
              consulting a SEBI-registered advisor before investing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvestmentsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [plan, setPlan] = useState<FinancialPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/");
      return;
    }

    const fetchPlan = async () => {
      try {
        const userId = localStorage.getItem("advisor_user_id");
        if (!userId) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/advisor/plan?user_id=${userId}`);
        const data = await res.json();

        if (data.success && data.plan?.plan) {
          setPlan(data.plan.plan);
        }
      } catch (err) {
        console.error("Failed to fetch plan:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [user, isLoaded, router]);

  if (loading || !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan || !plan.monthly_plan || plan.monthly_plan.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Wallet className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-semibold">No Investment Plan Yet</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Complete onboarding to see your personalized fund recommendations.
        </p>
        <button
          onClick={() => router.push("/onboarding")}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          Get Started
        </button>
      </div>
    );
  }

  // Use the first month's recommendations
  const currentMonth = plan.monthly_plan[0];

  // Aggregate funds from all categories
  const categories = [
    {
      id: "large_cap",
      title: "Large Cap Funds",
      description: "Stable returns from top 100 companies",
      icon: Building2,
      color: "bg-emerald-500",
      funds: currentMonth.large_cap_funds || [],
      sipAmount: currentMonth.sip_large_cap,
      tradingViewSymbol: "NSE:NIFTY",
    },
    {
      id: "mid_cap",
      title: "Mid Cap Funds",
      description: "Growth potential from mid-sized companies",
      icon: TrendingUp,
      color: "bg-sky-500",
      funds: currentMonth.mid_cap_funds || [],
      sipAmount: currentMonth.sip_mid_cap,
      tradingViewSymbol: "NSE:NIFTYMIDCAP100",
    },
    {
      id: "small_cap",
      title: "Small Cap Funds",
      description: "High growth potential with higher risk",
      icon: TrendingUp,
      color: "bg-violet-500",
      funds: currentMonth.small_cap_funds || [],
      sipAmount: currentMonth.sip_small_cap,
      tradingViewSymbol: "NSE:NIFTYSMALLCAP100",
    },
    {
      id: "debt",
      title: "Debt Funds",
      description: "Stable returns with lower volatility",
      icon: Wallet,
      color: "bg-amber-500",
      funds: currentMonth.debt_funds || [],
      sipAmount: currentMonth.sip_debt,
      tradingViewSymbol: "TVC:IN10Y",
    },
    {
      id: "gold",
      title: "Gold Funds",
      description: "Hedge against inflation and market volatility",
      icon: Coins,
      color: "bg-yellow-500",
      funds: currentMonth.gold_funds || [],
      sipAmount: currentMonth.sip_gold,
      tradingViewSymbol: "OANDA:XAUUSD",
    },
  ];

  const activeCategories = categories.filter(
    (c) => c.sipAmount > 0 || c.funds.length > 0,
  );

  return (
    <DashboardPageLayout>
      <div className="space-y-6 pb-8">
        {/* Page Header */}
        <div>
          <h1 className="text-xl font-bold">Investment Recommendations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Curated mutual funds based on your financial profile and goals
          </p>
        </div>

        {/* Category Tabs */}
        <Tabs
          defaultValue={activeCategories[0]?.id || "large_cap"}
          className="space-y-6"
        >
          <TabsList className="flex flex-wrap h-auto gap-1 p-1 w-full">
            {activeCategories.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="gap-2 data-[state=active]:bg-primary shrink-0"
              >
                <cat.icon className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {cat.title.split(" ")[0]}
                </span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {formatINR(cat.sipAmount)}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {activeCategories.map((cat) => (
            <TabsContent key={cat.id} value={cat.id} className="mt-0">
              <CategoryTab
                title={cat.title}
                description={cat.description}
                icon={cat.icon}
                funds={cat.funds}
                sipAmount={cat.sipAmount}
                color={cat.color}
                tradingViewSymbol={cat.tradingViewSymbol}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardPageLayout>
  );
}
