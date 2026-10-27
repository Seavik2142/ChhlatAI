import { useState, type ReactNode } from "react";
import type { ConversationDetail, InboxList as InboxData, QuickReply } from "../../lib/types";
import { ChatWindow, type ChatActions } from "./ChatWindow";
import { CopilotPanel, type CopilotActions } from "./CopilotPanel";
import { InboxList, type InboxTab } from "./InboxList";

export interface LiveChatProps {
  inbox: InboxData | undefined;
  tab: InboxTab;
  onTab: (t: InboxTab) => void;
  query: string;
  onQuery: (q: string) => void;
  selected: ConversationDetail | undefined;
  onSelect: (id: number) => void;
  online: boolean;
  meId?: number;
  quickReplies: QuickReply[];
  chatActions: ChatActions;
  copilotActions: CopilotActions;
  draft: string;
  onDraft: (v: string) => void;
  suggestion?: string | null;
  suggesting?: boolean;
  busy?: boolean;
  overlay?: ReactNode;
  onSuggest?: (instruction?: string) => void;
}

/**
 * MedTrackr-inspired Live Chat View
 * Left: Messages list column
 * Middle: Full spacious chat window with clean bubbles and composer
 * Right: Toggleable AI Copilot & Orders drawer (via header '...' button)
 */
export function LiveChat(p: LiveChatProps) {
  const [showCopilot, setShowCopilot] = useState(false);

  return (
    <div className="flex h-full min-w-0 min-h-0 flex-1 bg-white dark:bg-[#090d16] overflow-hidden">
      {/* Middle Column: Messages list */}
      <InboxList
        data={p.inbox}
        tab={p.tab}
        onTab={p.onTab}
        query={p.query}
        onQuery={p.onQuery}
        selectedId={p.selected?.id ?? null}
        onSelect={p.onSelect}
        online={p.online}
        meId={p.meId}
      />

      {/* Right Column: Chat Window + Optional Copilot Panel */}
      {p.selected ? (
        <div className="flex flex-1 min-w-0 min-h-0 h-full overflow-hidden">
          <ChatWindow
            c={p.selected}
            actions={p.chatActions}
            quickReplies={p.quickReplies}
            draft={p.draft}
            onDraft={p.onDraft}
            busy={p.busy}
            overlay={p.overlay}
            onToggleCopilot={() => setShowCopilot(!showCopilot)}
            copilotOpen={showCopilot}
            onSuggest={p.onSuggest}
            suggestion={p.suggestion}
            suggesting={p.suggesting}
          />

          {showCopilot && (
            <CopilotPanel
              c={p.selected}
              quickReplies={p.quickReplies}
              actions={p.copilotActions}
              suggestion={p.suggestion}
              suggesting={p.suggesting}
              onClose={() => setShowCopilot(false)}
            />
          )}
        </div>
      ) : (
        <div className="relative flex flex-1 items-center justify-center text-slate-400 dark:text-slate-500 bg-white dark:bg-[#090d16]">
          <div className="text-center">
            <p className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">No conversation selected</p>
            <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1">Select a customer from the left to start chatting</p>
          </div>
          {p.overlay}
        </div>
      )}
    </div>
  );
}
