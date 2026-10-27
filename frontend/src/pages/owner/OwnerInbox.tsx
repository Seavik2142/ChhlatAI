import { LiveChatContainer } from "../../components/inbox/LiveChatContainer";

export function OwnerInbox() {
  return (
    <div className="flex h-full w-full min-h-0 min-w-0 overflow-hidden">
      <LiveChatContainer />
    </div>
  );
}
