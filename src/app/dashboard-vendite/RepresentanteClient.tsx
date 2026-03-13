"use client";

import { useMemo, useState } from "react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Appointment = {
  id: string;
  created_at: string;
  cliente_nome: string;
  stato: string;
  data_videocall: string | null;
  note_commerciali: string | null;
  messaggio_originale_whatsapp: string | null;
  prezzo_accordo?: number | null;
};

export default function RepresentanteClient(props: { initial: Appointment[] }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [items, setItems] = useState<Appointment[]>(props.initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, Partial<Appointment>>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedItems = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();

    function isTodayDate(dt: Date) {
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
    }

    return [...items].sort((a, b) => {
      const aDt = a.data_videocall ? new Date(a.data_videocall) : null;
      const bDt = b.data_videocall ? new Date(b.data_videocall) : null;

      const aHas = !!(aDt && !Number.isNaN(aDt.getTime()));
      const bHas = !!(bDt && !Number.isNaN(bDt.getTime()));

      const aToday = aHas && isTodayDate(aDt as Date);
      const bToday = bHas && isTodayDate(bDt as Date);

      const aGroup = aToday ? 0 : aHas ? 1 : 2;
      const bGroup = bToday ? 0 : bHas ? 1 : 2;
      if (aGroup !== bGroup) return aGroup - bGroup;

      if (aHas && bHas) {
        return (aDt as Date).getTime() - (bDt as Date).getTime();
      }

      // fallback: newest first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [items]);

  function startEdit(a: Appointment) {
    setError(null);
    setEditingId(a.id);
    setDraft((prev) => ({
      ...prev,
      [a.id]: {
        cliente_nome: a.cliente_nome,
        note_commerciali: a.note_commerciali,
        prezzo_accordo: a.prezzo_accordo ?? null,
      },
    }));
  }

  function cancelEdit(id: string) {
    setEditingId(null);
    setDraft((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function saveEdit(id: string) {
    setError(null);
    setLoadingId(id);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Sessione non trovata. Esci e rientra (login) e riprova.");
      }

      const updates = draft[id] ?? {};
      const payload: {
        cliente_nome?: string;
        note_commerciali?: string | null;
        prezzo_accordo?: number | null;
      } = {};

      if (typeof updates.cliente_nome === "string") payload.cliente_nome = updates.cliente_nome;
      if (updates.note_commerciali === null || typeof updates.note_commerciali === "string") {
        payload.note_commerciali = updates.note_commerciali;
      }
      if (updates.prezzo_accordo === null || typeof updates.prezzo_accordo === "number") {
        payload.prezzo_accordo = updates.prezzo_accordo;
      }

      const res = await fetch("/api/rappresentante-update-appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          appointmentId: id,
          ...payload,
        }),
      });

      const json = (await res.json()) as
        | { success: true; appointment: Appointment }
        | { error: string };

      if (!res.ok) {
        const msg = "error" in json ? json.error : "Errore durante il salvataggio";
        throw new Error(`${msg} (HTTP ${res.status})`);
      }

      if (!("success" in json) || !json.success) {
        throw new Error("error" in json ? json.error : "Errore durante il salvataggio");
      }

      setItems((prev) => prev.map((a) => (a.id === id ? json.appointment : a)));
      setEditingId(null);
      setDraft((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Errore sconosciuto";
      setError(message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>I tuoi appuntamenti</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</div> : null}
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-zinc-600">Nessun appuntamento.</p>
            ) : (
              sortedItems.map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      {editingId === a.id ? (
                        <input
                          className="h-8 w-full rounded-md border border-zinc-300 px-2 text-sm"
                          value={(draft[a.id]?.cliente_nome as string) ?? ""}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              [a.id]: { ...prev[a.id], cliente_nome: e.target.value },
                            }))
                          }
                        />
                      ) : (
                        <div className="text-sm font-semibold">{a.cliente_nome}</div>
                      )}
                    <div className="text-xs text-zinc-600">Stato: {a.stato}</div>
                    <div className="text-xs text-zinc-600">
                      Videocall: {a.data_videocall ?? "-"}
                    </div>
                    <div className="text-xs text-zinc-600">
                      {editingId === a.id ? (
                        <textarea
                          className="mt-1 min-h-16 w-full rounded-md border border-zinc-300 p-2 text-xs"
                          value={(draft[a.id]?.note_commerciali as string | null) ?? ""}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              [a.id]: { ...prev[a.id], note_commerciali: e.target.value },
                            }))
                          }
                        />
                      ) : (
                        <>Note: {a.note_commerciali ?? "-"}</>
                      )}
                    </div>
                    <div className="text-xs text-zinc-600">
                      {editingId === a.id ? (
                        <div className="flex items-center gap-2">
                          <span>Prezzo:</span>
                          <input
                            className="h-8 w-32 rounded-md border border-zinc-300 px-2 text-xs"
                            inputMode="numeric"
                            value={
                              draft[a.id]?.prezzo_accordo === null || draft[a.id]?.prezzo_accordo === undefined
                                ? ""
                                : String(draft[a.id]?.prezzo_accordo)
                            }
                            onChange={(e) => {
                              const raw = e.target.value;
                              const next = raw.trim() === "" ? null : Number(raw);
                              setDraft((prev) => ({
                                ...prev,
                                [a.id]: { ...prev[a.id], prezzo_accordo: Number.isFinite(next as number) ? next : null },
                              }));
                            }}
                          />
                        </div>
                      ) : (
                        <>Prezzo: {a.prezzo_accordo ?? "-"}</>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {editingId === a.id ? (
                      <div className="flex gap-2">
                        <button
                          className="h-8 rounded-md bg-black px-3 text-xs text-white"
                          onClick={() => saveEdit(a.id)}
                          disabled={loadingId === a.id}
                        >
                          {loadingId === a.id ? "Salvando..." : "Salva"}
                        </button>
                        <button
                          className="h-8 rounded-md border border-zinc-300 px-3 text-xs text-zinc-700"
                          onClick={() => cancelEdit(a.id)}
                          disabled={loadingId === a.id}
                        >
                          Annulla
                        </button>
                      </div>
                    ) : (
                      <button className="text-xs text-blue-600 underline" onClick={() => startEdit(a)}>
                        Modifica
                      </button>
                    )}
                    <div className="text-[10px] text-zinc-500">
                      Non puoi spostare o annullare l’appuntamento.
                    </div>
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
