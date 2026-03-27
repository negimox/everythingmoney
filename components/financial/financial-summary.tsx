"use client";

import { useState } from "react";
import {
  Landmark,
  TrendingUp,
  PiggyBank,
  BarChart3,
  Banknote,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface FinancialSummaryProps {
  data: any[];
}

// Map FI types to readable labels and icons
const FI_TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof Landmark; color: string }
> = {
  DEPOSIT: {
    label: "Bank Accounts",
    icon: Landmark,
    color: "text-blue-500 bg-blue-500/10",
  },
  deposit: {
    label: "Bank Accounts",
    icon: Landmark,
    color: "text-blue-500 bg-blue-500/10",
  },
  MUTUAL_FUNDS: {
    label: "Mutual Funds",
    icon: TrendingUp,
    color: "text-emerald-500 bg-emerald-500/10",
  },
  EQUITIES: {
    label: "Equities",
    icon: BarChart3,
    color: "text-violet-500 bg-violet-500/10",
  },
  ETF: {
    label: "ETFs",
    icon: PiggyBank,
    color: "text-amber-500 bg-amber-500/10",
  },
  INSURANCE_POLICIES: {
    label: "Insurance",
    icon: Banknote,
    color: "text-rose-500 bg-rose-500/10",
  },
  insurance_policies: {
    label: "Insurance",
    icon: Banknote,
    color: "text-rose-500 bg-rose-500/10",
  },
  general_insurance: {
    label: "General Insurance",
    icon: Banknote,
    color: "text-rose-500 bg-rose-500/10",
  },
  life_insurance: {
    label: "Life Insurance",
    icon: Banknote,
    color: "text-pink-500 bg-pink-500/10",
  },
  TERM_DEPOSIT: {
    label: "Fixed Deposits",
    icon: Landmark,
    color: "text-teal-500 bg-teal-500/10",
  },
  term_deposit: {
    label: "Fixed Deposits",
    icon: Landmark,
    color: "text-teal-500 bg-teal-500/10",
  },
  recurring_deposit: {
    label: "Recurring Deposits",
    icon: Landmark,
    color: "text-cyan-500 bg-cyan-500/10",
  },
  SIP: {
    label: "SIP",
    icon: TrendingUp,
    color: "text-indigo-500 bg-indigo-500/10",
  },
  nps: {
    label: "NPS",
    icon: PiggyBank,
    color: "text-orange-500 bg-orange-500/10",
  },
  savings: {
    label: "Savings Accounts",
    icon: Landmark,
    color: "text-blue-500 bg-blue-500/10",
  },
  current: {
    label: "Current Accounts",
    icon: Landmark,
    color: "text-slate-500 bg-slate-500/10",
  },
};

function formatCurrency(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

/**
 * Helper: safely get a nested value from an object, trying both lowercase and PascalCase keys.
 * SETU returns lowercase (profile, holders) but we also handle PascalCase for flexibility.
 */
function getField(obj: any, ...keys: string[]): any {
  if (!obj) return undefined;
  let current = obj;
  for (const key of keys) {
    if (!current || typeof current !== "object") return undefined;
    // Try exact key first, then lowercase, then PascalCase
    current =
      current[key] ??
      current[key.toLowerCase()] ??
      current[key.charAt(0).toUpperCase() + key.slice(1)] ??
      undefined;
  }
  return current;
}

/**
 * Normalize a SETU account entry into a consistent shape.
 * SETU nests data as: { data: { account: { type, profile, summary, transactions } } }
 */
function normalizeAccount(rawAccount: any) {
  // The actual account data can be at rawAccount.data.account or rawAccount.account
  const accountData =
    rawAccount?.data?.account ||
    rawAccount?.account ||
    rawAccount?.data ||
    rawAccount;

  const accountType = accountData?.type || rawAccount?.fiType || "unknown";

  // Extract profile — try both casings
  const holders =
    getField(accountData, "profile", "holders", "holder") ||
    getField(accountData, "Profile", "Holders", "Holder") ||
    [];

  const holderName = holders?.[0]?.name || "Account Holder";
  const holderEmail = holders?.[0]?.email;
  const holderMobile = holders?.[0]?.mobile;
  const holderPan = holders?.[0]?.pan || holders?.[0]?.panNumber;
  const holderDob = holders?.[0]?.dob;

  // Extract summary — try both casings
  const summary =
    getField(accountData, "summary") ||
    getField(accountData, "Summary") ||
    {};

  const currentBalance =
    summary?.currentBalance ?? summary?.balance ?? summary?.currentValue;
  const investmentValue = summary?.investmentValue;
  const currentValue = summary?.currentValue;
  const branch = summary?.branch;
  const ifscCode = summary?.ifscCode || summary?.ifsc;

  // Extract transactions — try both casings
  const txnContainer =
    getField(accountData, "transactions") ||
    getField(accountData, "Transactions") ||
    {};
  const transactions =
    txnContainer?.transaction ||
    txnContainer?.Transaction ||
    [];

  return {
    maskedAccNumber: rawAccount?.maskedAccNumber || accountData?.maskedAccNumber || "••••",
    linkRefNumber: rawAccount?.linkRefNumber || "",
    fiType: accountType,
    fiStatus: rawAccount?.FIstatus || rawAccount?.fistatus || rawAccount?.status || "",
    holderName,
    holderEmail,
    holderMobile,
    holderPan,
    holderDob,
    currentBalance,
    investmentValue,
    currentValue,
    branch,
    ifscCode,
    transactions: Array.isArray(transactions) ? transactions : [],
    raw: accountData,
  };
}

function AccountCard({ account }: { account: ReturnType<typeof normalizeAccount> }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">
              {account.holderName}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {account.maskedAccNumber}
            </span>
            {account.fiStatus === "READY" && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-success/10 text-success">
                ✓
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="capitalize">{account.fiType.replace(/_/g, " ")}</span>
            {account.branch && <span>• {account.branch}</span>}
            {account.ifscCode && <span>• {account.ifscCode}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <div className="text-right">
            <span className="font-display font-semibold text-sm">
              {formatCurrency(
                account.currentBalance || account.currentValue
              )}
            </span>
            {account.investmentValue && (
              <div className="text-xs text-muted-foreground">
                Invested: {formatCurrency(account.investmentValue)}
              </div>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/30 px-4 py-3 space-y-3">
          {/* Profile info */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {account.holderEmail && (
              <div>
                <span className="text-muted-foreground">Email:</span>{" "}
                <span>{account.holderEmail}</span>
              </div>
            )}
            {account.holderPan && (
              <div>
                <span className="text-muted-foreground">PAN:</span>{" "}
                <span className="font-mono">{account.holderPan}</span>
              </div>
            )}
            {account.holderMobile && (
              <div>
                <span className="text-muted-foreground">Mobile:</span>{" "}
                <span>{account.holderMobile}</span>
              </div>
            )}
            {account.holderDob && (
              <div>
                <span className="text-muted-foreground">DOB:</span>{" "}
                <span>{account.holderDob}</span>
              </div>
            )}
          </div>

          {/* Transactions */}
          {account.transactions.length > 0 ? (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                Recent Transactions ({account.transactions.length})
              </h4>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {account.transactions.slice(0, 10).map((txn: any, i: number) => {
                  const txnType =
                    txn.type || txn.txnType || txn.transactionType || "";
                  const isCredit =
                    txnType.toUpperCase() === "CREDIT";
                  const amount = txn.amount || txn.transactionAmount || "0";
                  const timestamp =
                    txn.transactionTimestamp ||
                    txn.valueDate ||
                    txn.txnDate ||
                    txn.date ||
                    "";
                  const narration =
                    txn.narration ||
                    txn.description ||
                    txn.remarks ||
                    "Transaction";

                  return (
                    <div
                      key={txn.txnId || txn.transactionId || i}
                      className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-muted/30"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="truncate block">{narration}</span>
                        {timestamp && (
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(timestamp).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                      <span
                        className={`font-display font-medium ml-3 ${
                          isCredit ? "text-success" : "text-destructive"
                        }`}
                      >
                        {isCredit ? "+" : "-"}
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              No transaction data available
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function FinancialSummary({ data }: FinancialSummaryProps) {
  // Normalize all accounts from all FIPs
  const allNormalized: ReturnType<typeof normalizeAccount>[] = [];

  for (const fipData of data) {
    const accounts: any[] =
      fipData.data ||
      fipData.accounts ||
      fipData.Accounts ||
      [];

    if (!Array.isArray(accounts)) continue;

    for (const rawAccount of accounts) {
      // Skip accounts with FAILURE status
      if (rawAccount?.maskedAccNumber?.includes("FAILURE")) continue;

      const normalized = normalizeAccount(rawAccount);
      allNormalized.push(normalized);
    }
  }

  // Group by FI type
  const accountsByType: Record<string, ReturnType<typeof normalizeAccount>[]> = {};
  for (const acc of allNormalized) {
    const type = acc.fiType;
    if (!accountsByType[type]) {
      accountsByType[type] = [];
    }
    accountsByType[type].push(acc);
  }

  const fiTypes = Object.keys(accountsByType);
  const [activeTab, setActiveTab] = useState(fiTypes[0] || "");

  if (fiTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No financial data available</p>
      </div>
    );
  }

  // Calculate totals per FI type
  const typeTotals = fiTypes.map((type) => {
    const accounts = accountsByType[type];
    let total = 0;
    for (const acc of accounts) {
      const val =
        parseFloat(acc.currentBalance || "0") ||
        parseFloat(acc.currentValue || "0") ||
        0;
      total += val;
    }
    return { type, total, count: accounts.length };
  });

  const grandTotal = typeTotals.reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border/50 p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Net Worth</p>
          <p className="text-xl font-bold font-display">
            {formatCurrency(grandTotal)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Across {allNormalized.length} accounts
          </p>
        </div>
        {typeTotals.map(({ type, total, count }) => {
          const config = FI_TYPE_CONFIG[type] || {
            label: type.replace(/_/g, " "),
            icon: Landmark,
            color: "text-muted-foreground bg-muted",
          };
          const Icon = config.icon;
          return (
            <div
              key={type}
              className="bg-card rounded-xl border border-border/50 p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center ${config.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {config.label}
                </span>
              </div>
              <p className="font-bold font-display">{formatCurrency(total)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {count} account{count !== 1 ? "s" : ""}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tab navigation */}
      {fiTypes.length > 1 && (
        <div className="flex flex-wrap gap-1 p-1 bg-muted/50 rounded-lg w-fit">
          {fiTypes.map((type) => {
            const config = FI_TYPE_CONFIG[type] || {
              label: type.replace(/_/g, " "),
            };
            return (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                  activeTab === type
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Account cards for active tab */}
      <div className="space-y-3">
        {(accountsByType[activeTab] || []).map((account, i) => (
          <AccountCard
            key={account.linkRefNumber || i}
            account={account}
          />
        ))}
      </div>
    </div>
  );
}
