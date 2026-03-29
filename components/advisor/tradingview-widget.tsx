"use client";

import { useEffect, useRef, memo } from "react";

interface TradingViewWidgetProps {
  symbol?: string;
  height?: number;
  theme?: "light" | "dark";
  interval?: string;
}

function TradingViewWidgetComponent({
  symbol = "NSE:NIFTY",
  height = 300,
  theme = "dark",
  interval = "D",
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Clean up previous widget
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    // Create widget container
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    widgetContainer.style.height = `${height}px`;
    widgetContainer.style.width = "100%";

    if (containerRef.current) {
      containerRef.current.appendChild(widgetContainer);
    }

    // Create script
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: interval,
      timezone: "Asia/Kolkata",
      theme: theme,
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      hide_volume: true,
      support_host: "https://www.tradingview.com",
      container_id: widgetContainer.id,
    });

    if (containerRef.current) {
      containerRef.current.appendChild(script);
      scriptRef.current = script;
    }

    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
    };
  }, [symbol, height, theme, interval]);

  return (
    <div
      className="tradingview-widget-container w-full"
      ref={containerRef}
      style={{ height: `${height}px`, width: "100%" }}
    >
      <div
        className="tradingview-widget-container__widget"
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
const TradingViewWidget = memo(TradingViewWidgetComponent);
TradingViewWidget.displayName = "TradingViewWidget";

export default TradingViewWidget;
