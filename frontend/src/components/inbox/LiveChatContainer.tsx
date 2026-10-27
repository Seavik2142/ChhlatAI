import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { ConversationDetail, Courier, InboxList, Order, Product, QuickReply, Shop } from "../../lib/types";
import { useInboxEvents } from "../../lib/ws";
import { SendToDelivery } from "../commerce/SendToDelivery";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Card";
import { Field, Input, Select } from "../ui/Field";
import type { InboxTab } from "./InboxList";
import { LiveChat } from "./LiveChat";
import { PriorityToast } from "./PriorityToast";

interface Toast { title: string; body: string; conversationId: number | null }

export function LiveChatContainer({ onUnreadChange }: { onUnreadChange?: (n: number) => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const selectedId = Number(params.get("c")) || null;
  const [tab, setTab] = useState<InboxTab>("all");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [delivering, setDelivering] = useState<Order | null>(null);
  const [editing, setEditing] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connected = useInboxEvents((n) => {
    if (n.data.kind === "high_priority") {
      setToast({ title: n.data.title, body: n.data.body, conversationId: n.data.conversation_id });
    }
  });

  const inbox = useQuery({
    queryKey: ["conversations", tab, query],
    queryFn: () => api.get<InboxList>(`/conversations?tab=${tab}&q=${encodeURIComponent(query)}`),
  });
  const detail = useQuery({
    queryKey: ["conversation", selectedId],
    queryFn: () => api.get<ConversationDetail>(`/conversations/${selectedId}`),
    enabled: !!selectedId,
  });
  const quickReplies = useQuery({ queryKey: ["quick-replies"], queryFn: () => api.get<QuickReply[]>("/quick-replies") });
  const shop = useQuery({ queryKey: ["shop"], queryFn: () => api.get<Shop>("/shop") });

  const unread = inbox.data?.items.reduce((n, c) => n + (c.unread_count > 0 ? 1 : 0), 0) ?? 0;
  useEffect(() => onUnreadChange?.(unread), [unread, onUnreadChange]);

  // Open the most urgent chat by default.
  useEffect(() => {
    if (!selectedId && inbox.data?.items[0]) select(inbox.data.items[0].id);
  }, [selectedId, inbox.data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark as read when opened.
  useEffect(() => {
    if (selectedId && detail.data?.unread_count) {
      void api.post(`/conversations/${selectedId}/read`).then(() => qc.invalidateQueries({ queryKey: ["conversations"] }));
    }
  }, [selectedId, detail.data?.unread_count, qc]);

  function select(id: number) {
    setParams((p) => { p.set("c", String(id)); return p; }, { replace: true });
    setDraft("");
    setSuggestion(null);
  }

  const refresh = (data?: ConversationDetail) => {
    if (data) qc.setQueryData(["conversation", data.id], data);
    qc.invalidateQueries({ queryKey: ["conversations"] });
    qc.invalidateQueries({ queryKey: ["conversation", selectedId] });
  };
  const onError = (e: Error) => setError(e.message);

  const control = useMutation({
    mutationFn: (action: "takeover" | "resume-ai") =>
      api.post<ConversationDetail>(`/conversations/${selectedId}/${action}`),
    onSuccess: refresh, onError,
  });
  const send = useMutation({
    mutationFn: (body: string) => api.post(`/conversations/${selectedId}/messages`, { body }),
    onMutate: async (body: string) => {
      await qc.cancelQueries({ queryKey: ["conversation", selectedId] });
      const previous = qc.getQueryData<ConversationDetail>(["conversation", selectedId]);
      if (previous) {
        const optimisticMsg = {
          id: -Date.now(),
          sender: "staff" as const,
          staff_name: user?.full_name || "You",
          kind: "text" as const,
          body,
          attachment_url: null,
          meta: {},
          created_at: new Date().toISOString(),
        };
        qc.setQueryData<ConversationDetail>(["conversation", selectedId], {
          ...previous,
          messages: [...previous.messages, optimisticMsg],
        });
      }
      return { previous };
    },
    onError: (err, _body, context) => {
      if (context?.previous) {
        qc.setQueryData(["conversation", selectedId], context.previous);
      }
      onError(err as Error);
    },
    onSuccess: () => {
      setSuggestion(null);
      refresh();
    },
  });
  const sendMedia = useMutation({
    mutationFn: (file: File) => { const f = new FormData(); f.append("file", file); return api.post(`/conversations/${selectedId}/media`, f); },
    onSuccess: () => refresh(), onError,
  });
  const suggest = useMutation({
    mutationFn: (instruction?: string) =>
      api.post<{ reply: string }>(`/conversations/${selectedId}/suggest`, {
        instruction: instruction || "",
      }),
    onSuccess: (r) => setSuggestion(r.reply),
    onError,
  });
  const orderAction = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: unknown }) => api.post(path, body),
    onSuccess: () => { refresh(); qc.invalidateQueries({ queryKey: ["products"] }); }, onError,
  });

  const c = detail.data;

  return (
    <div className="flex h-full w-full min-h-0 min-w-0 overflow-hidden">
      <LiveChat
        inbox={inbox.data} tab={tab} onTab={setTab} query={query} onQuery={setQuery}
        selected={c} onSelect={select} online={connected} meId={user?.id}
        quickReplies={quickReplies.data ?? []} draft={draft} onDraft={setDraft}
        suggestion={suggestion} suggesting={suggest.isPending} busy={control.isPending}
        onSuggest={(inst) => suggest.mutate(inst)}
        chatActions={{
          takeOver: () => control.mutate("takeover"),
          resumeAi: () => control.mutate("resume-ai"),
          send: (text) => send.mutate(text),
          sendMedia: (file) => sendMedia.mutate(file),
          orderProduct: c && c.mode !== "ai" ? (productId) => orderAction.mutate({
            path: "/orders", body: { conversation_id: c.id, items: [{ product_id: productId, quantity: 1 }] },
          }) : undefined,
        }}
        copilotActions={{
          confirm: (o) => {
            orderAction.mutate({ path: `/orders/${o.id}/confirm` });
            window.open(`/print/${o.id}`, "_blank");
          },
          edit: setEditing,
          review: (o, approve) => orderAction.mutate({ path: `/orders/${o.id}/review?approve=${approve}` }),
          simulateBank: (o) => orderAction.mutate({ path: `/orders/${o.id}/simulate-bank-confirmation` }),
          sendToDelivery: setDelivering,
          shareTracking: (o) => o.delivery && (c?.mode === "ai"
            ? setError('Take over first to send a message yourself.')
            : send.mutate(`🚚 ${o.invoice_no}: ${o.delivery.tracking_url}`)),
          suggest: (inst) => suggest.mutate(inst),
          insert: (text) => setDraft(text),
          quickReply: (q) => setDraft(q.command),
        }}
        overlay={toast && (
          <PriorityToast title={toast.title} body={toast.body} onDismiss={() => setToast(null)}
            onReply={() => { if (toast.conversationId) select(toast.conversationId); setToast(null); }} />
        )}
      />

      <Modal open={!!delivering} onClose={() => setDelivering(null)} title="Send to delivery" width={480}>
        {delivering && (
          <SendToDelivery order={delivering} fees={shop.data?.delivery_fees ?? {}} sending={orderAction.isPending}
            onPrint={() => window.open(`/print/${delivering.id}`, "_blank")}
            onSend={(courier: Courier, cod) => orderAction.mutate(
              { path: `/orders/${delivering.id}/delivery`, body: { courier, cash_on_delivery: cod } },
              { onSuccess: () => setDelivering(null) })} />
        )}
      </Modal>

      {editing && <EditOrderModal order={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}

      <Modal open={!!error} onClose={() => setError(null)} title="Something needs attention">
        <p className="text-body text-ink-2">{error}</p>
        <div className="mt-4 flex justify-end"><Button onClick={() => setError(null)}>OK</Button></div>
      </Modal>
    </div>
  );
}

function EditOrderModal({ order, onClose, onSaved }: { order: Order; onClose: () => void; onSaved: () => void }) {
  const products = useQuery({ queryKey: ["products"], queryFn: () => api.get<Product[]>("/products") });
  const [items, setItems] = useState(order.items.map((i) => ({ product_id: i.product_id ?? 0, quantity: i.quantity })));
  const [zone, setZone] = useState(order.delivery_zone ?? "phnom_penh");
  const [address, setAddress] = useState(order.delivery_address ?? "");
  const save = useMutation({
    mutationFn: () => api.patch(`/orders/${order.id}`, { items: items.filter((i) => i.product_id), delivery_zone: zone, delivery_address: address }),
    onSuccess: onSaved,
  });
  return (
    <Modal open onClose={onClose} title={`Edit ${order.invoice_no}`}>
      <div className="flex flex-col gap-4">
        {items.map((it, idx) => (
          <div key={idx} className="flex gap-2">
            <Select value={it.product_id} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, product_id: Number(e.target.value) } : x))}>
              {products.data?.filter((p) => p.is_active).map((p) => <option key={p.id} value={p.id}>{p.name} · ${p.price.toFixed(2)}</option>)}
            </Select>
            <Input type="number" min={1} className="w-20" value={it.quantity}
              onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, quantity: Math.max(1, Number(e.target.value)) } : x))} />
            <Button variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}>×</Button>
          </div>
        ))}
        <Button variant="secondary" onClick={() => setItems([...items, { product_id: products.data?.[0]?.id ?? 0, quantity: 1 }])}>
          + Add product
        </Button>
        <Field label="Delivery">
          <Select value={zone} onChange={(e) => setZone(e.target.value)}>
            <option value="phnom_penh">Phnom Penh</option>
            <option value="province">Province</option>
            <option value="grab">Grab · 1 hour</option>
          </Select>
        </Field>
        <Field label="Address"><Input value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
        {save.error && <p className="text-caption text-danger">{save.error.message}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={save.isPending} onClick={() => save.mutate()}>Save invoice</Button>
        </div>
      </div>
    </Modal>
  );
}
