import { useQuery } from "@tanstack/react-query";
import { odooRpc } from "../services/odoo-rpc";
import { STALE_TIMES } from "../services/query-client";
import { useAuthStore } from "../stores/auth-store";

export interface IOdooNotification {
  id: number;
  subject: string;
  preview: string;
  authorName: string;
  date: string;
  model: string | null;
  resId: number | null;
  modelName: string | null;
  messageType: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function useNotifications() {
  const uid = useAuthStore((s: any) => s.user?.uid);

  return useQuery<IOdooNotification[]>({
    queryKey: ["odoo", "mail.message", "inbox", uid],
    queryFn: async () => {
      // Fetch messages from inbox (needaction)
      const messages = await odooRpc.callKw<
        Array<{
          id: number;
          subject: string | false;
          body: string;
          author_id: [number, string] | false;
          date: string;
          model: string | false;
          res_id: number | false;
          message_type: string;
          record_name: string | false;
        }>
      >({
        model: "mail.message",
        method: "search_read",
        args: [[["needaction", "=", true]]],
        kwargs: {
          fields: [
            "subject",
            "body",
            "author_id",
            "date",
            "model",
            "res_id",
            "message_type",
            "record_name",
          ],
          limit: 50,
          order: "date desc",
        },
      });

      return messages.map((msg) => ({
        id: msg.id,
        subject: msg.subject || msg.record_name || "",
        preview: stripHtml(msg.body).slice(0, 200),
        authorName: Array.isArray(msg.author_id) ? msg.author_id[1] : "",
        date: msg.date,
        model: msg.model || null,
        resId: msg.res_id || null,
        modelName: msg.record_name || msg.model || null,
        messageType: msg.message_type,
      }));
    },
    staleTime: STALE_TIMES.REALTIME,
    enabled: !!uid,
  });
}
