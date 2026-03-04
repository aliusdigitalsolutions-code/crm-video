"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";

type Appointment = {
  id: string;
  created_at: string;
  cliente_nome: string;
  stato: string;
  data_videocall: string | null;
  note_commerciali: string | null;
  messaggio_originale_whatsapp: string | null;
};

export default function ParserClient(props: { initial: Appointment[] }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Appointment[]>(props.initial);

  async function onParse() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/parse-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const json = (await res.json()) as
        | { appointment: Appointment }
        | { error: string; raw?: unknown };

      if (!res.ok) {
        const message = "error" in json ? json.error : "Request failed";
        setError(message);
        return;
      }

      if ("appointment" in json) {
        setItems((prev) => [json.appointment, ...prev]);
        setText("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Parsing WhatsApp (GPT-4o)</CardTitle>
          <p className="text-sm text-zinc-600">
            Incolla il messaggio WhatsApp e premi “Estrai e salva”.
          </p>
        </CardHeader>
        <CardContent>
          <textarea
            className="h-40 w-full resize-y rounded-md border p-3 text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Incolla qui il messaggio..."
          />

          {error ? (
            <Toast variant="error" className="mt-3">
              {error}
            </Toast>
          ) : null}

          <button
            className="mt-3 h-10 rounded-md bg-black px-4 text-sm font-medium text-white disabled:opacity-60"
            onClick={onParse}
            disabled={loading || text.trim().length === 0}
          >
            {loading ? "Elaborazione..." : "Estrai e salva"}
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ultimi appuntamenti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-zinc-600">Nessun appuntamento.</p>
            ) : (
              items.map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-semibold">{a.cliente_nome}</div>
                    <div className="text-xs text-zinc-600">Stato: {a.stato}</div>
                    <div className="text-xs text-zinc-600">
                      Videocall: {a.data_videocall ?? "-"}
                    </div>
                    <div className="text-xs text-zinc-600">
                      Note: {a.note_commerciali ?? "-"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
