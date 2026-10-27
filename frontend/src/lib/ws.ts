import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { tokenStore } from "./api";
import type { ConversationDetail, ConversationSummary, Message, Notification } from "./types";

type InboxEvent =
  | { event: "message"; data: { conversation: ConversationSummary; message: Message } }
  | { event: "conversation"; data: { conversation: ConversationSummary } }
  | { event: "notification"; data: Pick<Notification, "id" | "kind" | "title" | "body" | "conversation_id"> };

/** Keeps the inbox caches live and surfaces high-priority alerts as they arrive. */
export function useInboxEvents(onNotification?: (n: InboxEvent & { event: "notification" }) => void) {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const notify = useRef(onNotification);
  notify.current = onNotification;

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout>;
    let ping: ReturnType<typeof setInterval>;
    let closed = false;

    const connect = () => {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(`${proto}://${location.host}/api/v1/ws?token=${encodeURIComponent(token)}`);
      ws.onopen = () => {
        setConnected(true);
        ping = setInterval(() => ws?.readyState === WebSocket.OPEN && ws.send("ping"), 25_000);
      };
      ws.onclose = () => {
        setConnected(false);
        clearInterval(ping);
        if (!closed) retry = setTimeout(connect, 3000);
      };
      ws.onmessage = (e) => {
        const evt = JSON.parse(e.data) as InboxEvent;
        if (evt.event === "notification") {
          qc.invalidateQueries({ queryKey: ["notifications"] });
          notify.current?.(evt);
          return;
        }
        const conv = evt.data.conversation;
        qc.invalidateQueries({ queryKey: ["conversations"] });
        if (evt.event === "message") {
          qc.setQueryData<ConversationDetail>(["conversation", conv.id], (old) =>
            old && !old.messages.some((m) => m.id === evt.data.message.id)
              ? { ...old, ...conv, messages: [...old.messages, evt.data.message] }
              : old,
          );
        }
        qc.invalidateQueries({ queryKey: ["conversation", conv.id] });
      };
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      clearInterval(ping);
      ws?.close();
    };
  }, [qc]);

  return connected;
}
