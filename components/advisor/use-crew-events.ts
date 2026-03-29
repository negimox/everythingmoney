"use client";

import { useEffect, useState, useRef, useCallback } from "react";

export interface CrewEvent {
  type: string;
  timestamp: string;
  [key: string]: any;
}

export interface CrewEventsState {
  events: CrewEvent[];
  isConnected: boolean;
  error: string | null;
}

export interface UseCrewEventsReturn extends CrewEventsState {
  clearEvents: () => void;
  disconnect: () => void;
}

/**
 * React hook for consuming Server-Sent Events from CrewAI execution.
 *
 * Usage:
 *   const { events, isConnected, clearEvents } = useCrewEvents(sessionId);
 *
 *   // Events include:
 *   // - crew_started, crew_completed, crew_failed
 *   // - task_started, task_completed, task_failed
 *   // - agent_started, agent_finished
 *   // - tool_started, tool_finished
 *   // - thought_started, thought_finished
 */
export function useCrewEvents(sessionId: string | null): UseCrewEventsReturn {
  const [events, setEvents] = useState<CrewEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setError(null);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      disconnect();
      return;
    }

    // Close existing connection if any
    disconnect();

    // Create new EventSource connection
    const backendUrl =
      process.env.NEXT_PUBLIC_ADVISOR_BACKEND_URL || "http://127.0.0.1:8001";
    const eventSource = new EventSource(
      `${backendUrl}/api/events/stream/${sessionId}`,
    );
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as CrewEvent;

        // Ignore ping events
        if (data.type === "ping") {
          return;
        }

        setEvents((prev) => [...prev, data]);
      } catch (err) {
        console.error("Failed to parse SSE event:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      setError("Connection error. Retrying...");
      setIsConnected(false);

      // EventSource will automatically attempt to reconnect
      // If we want to stop reconnecting after multiple failures:
      // disconnect();
    };

    // Cleanup on unmount or sessionId change
    return () => {
      disconnect();
    };
  }, [sessionId, disconnect]);

  return {
    events,
    isConnected,
    error,
    clearEvents,
    disconnect,
  };
}
