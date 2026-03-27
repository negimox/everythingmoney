"use client";

import React, { useState, useEffect } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import LightweightChartWidget from "@/components/widgets/lightweight-chart";
import BracketsIcon from "@/components/icons/brackets";
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StockLogo } from "@/components/ui/stock-logo";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

interface StockData {
    price: number;
    change: number;
    percent: number;
    name?: string;
    symbol?: string;
    volume?: number | string;
    open?: number;
    prevClose?: number;
    marketCap?: number | string;
    low?: number;
    high?: number;
    isin?: string;
}

// ─── Currency Helper ──────────────────────────────────────────────────────────

function getCurrencySymbol(type: string): string {
    switch (type) {
        case "NSE":
        case "BSE":
        case "COMMODITY":
            return "₹";
        case "US":
        case "CRYPTO":
        default:
            return "$";
    }
}

function fmtPrice(price: number, type: string): string {
    const locale = (type === "NSE" || type === "BSE" || type === "COMMODITY") ? "en-IN" : "en-US";
    return getCurrencySymbol(type) + price.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// The old StockLogo component was extracted to components/ui/stock-logo.tsx

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StockAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
    const [id, setId] = useState<string>("");
    const [data, setData] = useState<StockData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        params.then(p => setId(p.id));
    }, [params]);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const parts = id.split('-');
                const type = parts[0].toLowerCase();
                const symbol = parts.slice(1).join('-'); // Handle symbols with hyphens

                const response = await fetch(`/api/watchlist/${type}`);
                const allData = await response.json();

                // 1. Direct match by ID
                let stockInfo = allData[symbol] || allData[symbol.toUpperCase()];

                // 2. Search all keys if not found
                if (!stockInfo) {
                    const foundKey = Object.keys(allData).find(k =>
                        allData[k].symbol?.toUpperCase() === symbol.toUpperCase()
                    );
                    if (foundKey) stockInfo = allData[foundKey];
                }

                if (stockInfo) {
                    setData(stockInfo);
                }
            } catch (err) {
                console.error("Error fetching stock data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading || !id) {
        return (
            <DashboardPageLayout
                header={{
                    title: "Loading...",
                    description: "Fetching stock data",
                    icon: BracketsIcon,
                }}
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-card/50 border border-border/50 rounded-xl p-4 flex flex-col gap-3">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-8 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        ))}
                    </div>
                    <Skeleton className="h-[600px] w-full rounded-xl" />
                </div>
            </DashboardPageLayout>
        );
    }

    const parts = id.split('-');
    const type = (parts[0] || "").toUpperCase();
    const rawSymbol = parts.slice(1).join('-').toUpperCase();
    const symbol = data?.symbol ? data.symbol.toUpperCase() : rawSymbol;

    const toNum = (val: any) => {
        const n = parseFloat(val);
        return isNaN(n) ? 0 : n;
    };

    const price = toNum(data?.price);
    const change = toNum(data?.change);
    const percent = toNum(data?.percent);
    const isPositive = change >= 0;

    return (
        <DashboardPageLayout
            header={{
                title: (
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href="/watchlist">Watchlist</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{data?.name || symbol}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                ),
                description: `${type}:${symbol} • Real-time Market Data`,
                icon: BracketsIcon,
            }}
        >
            <div className="space-y-6">
                {/* Stock Header with Logo */}
                <div className="flex items-center gap-4">
                    <StockLogo symbol={symbol} name={data?.name} type={type} />
                    <div>
                        <h2 className="text-xl font-bold font-display">{data?.name || symbol}</h2>
                        <p className="text-sm text-muted-foreground">{type}:{symbol}</p>
                    </div>
                    <div className="ml-auto text-right">
                        <div className="text-2xl font-display font-bold">
                            {fmtPrice(price, type)}
                        </div>
                        <div className={`text-sm font-semibold font-display flex items-center gap-1 justify-end ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {change >= 0 ? '+' : ''}{change.toFixed(2)} ({percent >= 0 ? '+' : ''}{percent.toFixed(2)}%)
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-card/50 border border-border/50 rounded-xl p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold tracking-tighter">
                            <DollarSign className="w-3 h-3" />
                            Current Price
                        </div>
                        <div className="text-2xl font-display font-bold">
                            {fmtPrice(price, type)}
                        </div>
                        <div className={`text-xs font-semibold font-display flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {change >= 0 ? '+' : ''}{change.toFixed(2)} ({percent >= 0 ? '+' : ''}{percent.toFixed(2)}%)
                        </div>
                    </div>

                    <div className="bg-card/50 border border-border/50 rounded-xl p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold tracking-tighter">
                            <Activity className="w-3 h-3" />
                            Day Range
                        </div>
                        <div className="text-sm font-semibold font-display mt-1">
                            L: {data?.low ? fmtPrice(toNum(data.low), type) : "—"} — H: {data?.high ? fmtPrice(toNum(data.high), type) : "—"}
                        </div>
                        <div className="w-full bg-muted/30 h-1 rounded-full mt-2 overflow-hidden">
                            {data?.low && data?.high && price ? (
                                <div
                                    className="bg-primary h-full transition-all"
                                    style={{
                                        width: `${Math.max(0, Math.min(100, ((price - toNum(data.low)) / (toNum(data.high) - toNum(data.low))) * 100))}%`
                                    }}
                                />
                            ) : (
                                <div className="bg-primary h-full w-[50%]" />
                            )}
                        </div>
                    </div>

                    <div className="bg-card/50 border border-border/50 rounded-xl p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold tracking-tighter">
                            <BarChart3 className="w-3 h-3" />
                            Volume
                        </div>
                        <div className="text-xl font-bold font-display mt-1">
                            {data?.volume || "—"}
                        </div>
                    </div>

                    <div className="bg-card/50 border border-border/50 rounded-xl p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold tracking-tighter">
                            <TrendingUp className="w-3 h-3" />
                            Market Cap
                        </div>
                        <div className="text-xl font-bold font-display mt-1">
                            {data?.marketCap || "—"}
                        </div>
                    </div>
                </div>

                {/* Lightweight Chart */}
                <div className="h-[600px] w-full bg-[#0a0a0a] rounded-xl border border-border/50 overflow-hidden shadow-2xl">
                    <LightweightChartWidget
                        marketType={type.toLowerCase()}
                        symbol={rawSymbol}
                        currentPrice={price}
                        change={change}
                    />
                </div>
            </div>
        </DashboardPageLayout>
    );
}
