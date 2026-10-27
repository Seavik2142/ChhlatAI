import { Badge } from "../ui/Badge";
import type { ConversationSummary } from "../../lib/types";

/** Status language shared by all panels (Figma "Legend · Status & tags"). */
export function SentimentBadge({ sentiment }: { sentiment: ConversationSummary["sentiment"] }) {
  if (sentiment === "angry") return <Badge tone="danger">🚨 Angry / Urgent</Badge>;
  if (sentiment === "interested") return <Badge tone="warning">🟡 Interested</Badge>;
  return <Badge tone="success">🟢 Normal</Badge>;
}

export function ConversationTags({ c, meId }: { c: ConversationSummary; meId?: number }) {
  return (
    <>
      {c.high_priority && <Badge tone="danger">🚨 High priority</Badge>}
      {c.mode === "waiting_staff" && <Badge tone="danger" dot>Wait staff</Badge>}
      {!c.high_priority && <SentimentBadge sentiment={c.sentiment} />}
      {c.mode === "ai" && <Badge tone="success">🤖 {c.sentiment === "interested" ? "AI replying" : "AI"}</Badge>}
      {c.mode === "manual" && (
        <Badge tone="brand">{c.assigned_staff_id === meId ? "You" : c.assigned_staff_name ?? "Staff"}</Badge>
      )}
    </>
  );
}
