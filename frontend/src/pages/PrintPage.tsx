import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";

/** Loads the server-rendered invoice + QR delivery slip (auth required) and prints it. */
export function PrintPage() {
  const { orderId } = useParams();
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    void api.get<string>(`/orders/${orderId}/print`).then((html) => {
      if (frame.current) frame.current.srcdoc = html;
    });
  }, [orderId]);
  return <iframe ref={frame} title="Print" className="h-screen w-full border-0" sandbox="allow-scripts allow-modals" />;
}
