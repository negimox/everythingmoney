"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface DashboardContextType {
  activeView: "dashboard" | "chat";
  setActiveView: (view: "dashboard" | "chat") => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<"dashboard" | "chat">(
    "dashboard",
  );

  return (
    <DashboardContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardView() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardView must be used within DashboardProvider");
  }
  return context;
}
