"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BadgeNeutral } from "@/components/ui/Badge";
import { Toast } from "@/components/ui/Toast";

type Appointment = {
  id: string;
  cliente_nome: string;
  stato: string;
  note_social: string | null;
  link_pubblicazione: string | null;
};

export default function SmmClient(props: { initial: Appointment[] }) {
  const [items, setItems] = useState(props.initial);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onUpdateLink(appointmentId: string, link: string) {
    setError(null);
    setUpdatingId(appointmentId);

    try {
      const res = await fetch("/api/update-link-pubblicazione", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, link }),
      });

      const json = (await res.json()) as
        | { success: true }
        | { error: string };

      if (!res.ok) {
        const message = "error" in json ? json.error : "Update failed";
        setError(message);
        return;
      }

      if ("success" in json) {
        setItems((prev) =>
          prev.map((a) =>
            a.id === appointmentId ? { ...a, link_pubblicazione: link } : a,
          ),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Clienti attivi (per SMM)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-zinc-600">Nessun cliente attivo.</p>
            ) : (
              items.map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-semibold">{a.cliente_nome}</div>
                    <BadgeNeutral>{a.stato}</BadgeNeutral>
                    <div className="text-xs text-zinc-600">Note social: {a.note_social ?? "-"}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="Link pubblicazione"
                        defaultValue={a.link_pubblicazione ?? ""}
                        data-id={a.id}
                        className="h-8 flex-1 rounded-md border px-2 text-xs"
                        disabled={updatingId === a.id}
                      />
                      <button
                        className="h-8 rounded-md bg-black px-3 text-xs text-white disabled:opacity-60"
                        disabled={updatingId === a.id}
                        onClick={() => {
                          const input = document.querySelector(
                            `input[data-id="${a.id}"]`,
                          ) as HTMLInputElement;
                          if (input) onUpdateLink(a.id, input.value);
                        }}
                      >
                        {updatingId === a.id ? "Salvando..." : "Salva"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Toast variant="error">
          {error}
        </Toast>
      ) : null}
    </div>
  );
}
