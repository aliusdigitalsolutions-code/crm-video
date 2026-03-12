// Admin: sezioni per assegnare compiti a Videomaker e SMM
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BadgeSuccess, BadgeNeutral, BadgeWarning } from "@/components/ui/Badge";
import { Toast } from "@/components/ui/Toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function formatSupabaseError(e: unknown) {
  if (!e) return "Errore sconosciuto";
  if (e instanceof Error) return e.message;
  if (typeof e === "object") {
    const anyE = e as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    const msg = typeof anyE.message === "string" ? anyE.message : "";
    const code = typeof anyE.code === "string" ? anyE.code : "";
    const details = typeof anyE.details === "string" ? anyE.details : "";
    const hint = typeof anyE.hint === "string" ? anyE.hint : "";
    const extra = [code && `code=${code}`, details && `details=${details}`, hint && `hint=${hint}`]
      .filter(Boolean)
      .join(" | ");
    return extra ? `${msg || "Errore"} (${extra})` : msg || "Errore";
  }
  return String(e);
}

function splitDateTime(value: string | null) {
  if (!value) return { date: "", time: "" };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { date, time };
}

function combineDateTime(date: string, time: string) {
  if (!date) return null;
  if (!time) return null;

  const [y, m, d] = date.split("-").map((v) => Number(v));
  const [hh, mm] = time.split(":").map((v) => Number(v));
  if (!y || !m || !d) return null;
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  const local = new Date(y, m - 1, d, hh, mm, 0, 0);
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}

function formatDateTimeIt(value: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TIME_OPTIONS = (() => {
  const times: string[] = [];
  for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 20 && m > 0) continue;
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return times;
})();

type Profile = {
  id: string;
  full_name: string;
  role: string;
};

type Appointment = {
  id: string;
  created_at: string;
  cliente_nome: string;
  stato: string;
  data_videocall: string | null;
  messaggio_originale_whatsapp: string | null;
  note_commerciali: string | null;
  prezzo_accordo: number | null;
  durata_mesi: number | null;
  file_contratto_url: string | null;
  paese_citta: string | null;
  data_shooting: string | null;
  note_video: string | null;
  note_social: string | null;
  link_pubblicazione: string | null;
};

export default function AdminClient(props: { initial: Appointment[] }) {
  const supabase = createSupabaseBrowserClient();
  const [appointments, setAppointments] = useState(props.initial);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftEdits, setDraftEdits] = useState<Record<string, Partial<Appointment>>>({});
  const [smmDaysDraft, setSmmDaysDraft] = useState<Record<string, string[]>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function parseSmmDays(value: string | null) {
    if (!value) return [];
    const parts = value
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    return Array.from(new Set(parts));
  }

  // Carica profili al mount
  useEffect(() => {
    async function fetchProfiles() {
      const { data } = await supabase.from("profiles").select("id, full_name, role");
      setProfiles(data ?? []);
    }
    fetchProfiles();
  }, []);

  async function onSave(id: string, updates: Partial<Appointment>) {
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      if (!data) {
        throw new Error("Aggiornamento non riuscito (nessuna riga aggiornata). Verifica RLS/policy Supabase.");
      }

      setAppointments((prev) => prev.map((a) => (a.id === id ? (data as Appointment) : a)));
      setEditingId(null);
      setDraftEdits((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e) {
      setError(formatSupabaseError(e));
    } finally {
      setLoading(false);
    }
  }

  function startEdit(a: Appointment) {
    setEditingId(a.id);
    setDraftEdits((prev) => ({
      ...prev,
      [a.id]: {
        cliente_nome: a.cliente_nome,
        stato: a.stato,
        data_videocall: a.data_videocall,
        prezzo_accordo: a.prezzo_accordo,
        durata_mesi: a.durata_mesi,
        paese_citta: a.paese_citta,
        data_shooting: a.data_shooting,
        note_commerciali: a.note_commerciali,
        note_video: a.note_video,
        note_social: a.note_social,
        link_pubblicazione: a.link_pubblicazione,
      },
    }));
  }

  function cancelEdit(id: string) {
    setEditingId(null);
    setDraftEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function onDelete(id: string) {
    if (!confirm("Sei sicuro di eliminare questo appuntamento?")) return;
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      setError(formatSupabaseError(e));
    } finally {
      setLoading(false);
    }
  }

  async function onAssignToVideomaker(id: string) {
    await onSave(id, { stato: "chiuso" });
  }

  async function onAssignToSMM(id: string) {
    await onSave(id, { note_social: "Da pubblicare" });
  }

  async function onAssignVideomakerTask(id: string, paese_citta: string | null, data_shooting: string | null, note_video: string | null) {
    if (!data_shooting) {
      setError("Per assegnare al Videomaker serve una data shooting (formato ISO)");
      return;
    }
    await onSave(id, { paese_citta, data_shooting, note_video });
  }

  async function onAssignSMMTask(id: string, note_social: string | null, link_pubblicazione: string | null) {
    await onSave(id, { note_social, link_pubblicazione });
  }

  async function onInsert(newAppointment: Omit<Appointment, "id" | "created_at">) {
    setError(null);
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch("/api/admin-insert-appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          appointment: newAppointment,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      const json = (await res.json()) as
        | { success: true; appointment: Appointment }
        | { error: string };

      if (!res.ok) {
        throw new Error("error" in json ? json.error : "Errore durante il salvataggio");
      }

      if (!("success" in json) || !json.success) {
        throw new Error("error" in json ? json.error : "Errore durante il salvataggio");
      }

      setAppointments((prev) => [json.appointment as Appointment, ...prev]);
      setShowNewForm(false);
    } catch (e) {
      setError(formatSupabaseError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Utenti */}
      <Card>
        <CardHeader>
          <CardTitle>Utenti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {profiles.length === 0 ? (
              <p className="text-sm text-zinc-600">Nessun utente.</p>
            ) : (
              profiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-2">
                  <div className="text-sm font-medium">{p.full_name}</div>
                  <BadgeNeutral>{p.role}</BadgeNeutral>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assegna a Videomaker */}
      <Card>
        <CardHeader>
          <CardTitle>Assegna a Videomaker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {appointments.filter(a => a.stato === "chiuso").length === 0 ? (
              <p className="text-sm text-zinc-600">Nessun cliente chiuso da assegnare.</p>
            ) : (
              appointments.filter(a => a.stato === "chiuso").map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <div className="text-sm font-semibold mb-2">{a.cliente_nome}</div>
                  <div className="space-y-2">
                    <input
                      className="w-full rounded-md border px-2 py-1 text-xs"
                      placeholder="Paese/Città"
                      id={`videomaker-paese-${a.id}`}
                      defaultValue={a.paese_citta ?? ""}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="w-full rounded-md border px-2 py-1 text-xs"
                        type="date"
                        id={`videomaker-data-date-${a.id}`}
                        defaultValue={splitDateTime(a.data_shooting).date}
                      />
                      <select
                        className="w-full rounded-md border px-2 py-1 text-xs"
                        id={`videomaker-data-time-${a.id}`}
                        defaultValue={splitDateTime(a.data_shooting).time}
                      >
                        <option value="">Ora</option>
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      className="w-full rounded-md border px-2 py-1 text-xs"
                      placeholder="Note video"
                      id={`videomaker-note-${a.id}`}
                      defaultValue={a.note_video ?? ""}
                    />
                    <button
                      className="h-8 rounded-md bg-blue-600 px-3 text-xs text-white"
                      onClick={() => {
                        const paese_citta = (document.getElementById(`videomaker-paese-${a.id}`) as HTMLInputElement)?.value || null;
                        const shootingDate = (document.getElementById(`videomaker-data-date-${a.id}`) as HTMLInputElement)?.value || "";
                        const shootingTime = (document.getElementById(`videomaker-data-time-${a.id}`) as HTMLSelectElement)?.value || "";
                        const data_shooting = shootingDate || shootingTime ? combineDateTime(shootingDate, shootingTime) : null;
                        const note_video = (document.getElementById(`videomaker-note-${a.id}`) as HTMLTextAreaElement)?.value || null;
                        onAssignVideomakerTask(a.id, paese_citta, data_shooting, note_video);
                      }}
                      disabled={loading}
                    >
                      Assegna
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assegna a SMM */}
      <Card>
        <CardHeader>
          <CardTitle>Assegna a SMM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {appointments.filter(a => ["chiuso", "in_prova", "potenziale"].includes(a.stato)).length === 0 ? (
              <p className="text-sm text-zinc-600">Nessun cliente attivo da assegnare.</p>
            ) : (
              appointments.filter(a => ["chiuso", "in_prova", "potenziale"].includes(a.stato)).map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <div className="text-sm font-semibold mb-2">{a.cliente_nome}</div>
                  <div className="space-y-2">
                    <textarea
                      className="w-full rounded-md border px-2 py-1 text-xs"
                      placeholder="Note social"
                      id={`smm-note-${a.id}`}
                      defaultValue={a.note_social ?? ""}
                    />
                    <div className="space-y-2">
                      {(smmDaysDraft[a.id] ?? parseSmmDays(a.link_pubblicazione) ?? [""]).length === 0 ? null : null}
                      {(smmDaysDraft[a.id] ?? parseSmmDays(a.link_pubblicazione)).length === 0 ? (
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <select
                            className="w-full rounded-md border px-2 py-1 text-xs"
                            value={""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setSmmDaysDraft((prev) => ({
                                ...prev,
                                [a.id]: v ? [v] : [],
                              }));
                            }}
                          >
                            <option value="">Giorno di pubblicazione</option>
                            <option value="lunedi">Ogni lunedì</option>
                            <option value="martedi">Ogni martedì</option>
                            <option value="mercoledi">Ogni mercoledì</option>
                            <option value="giovedi">Ogni giovedì</option>
                            <option value="venerdi">Ogni venerdì</option>
                            <option value="sabato">Ogni sabato</option>
                            <option value="domenica">Ogni domenica</option>
                          </select>
                          <button
                            className="h-8 rounded-md border border-zinc-300 px-3 text-xs text-zinc-700"
                            type="button"
                            onClick={() =>
                              setSmmDaysDraft((prev) => ({
                                ...prev,
                                [a.id]: [""],
                              }))
                            }
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        (smmDaysDraft[a.id] ?? parseSmmDays(a.link_pubblicazione)).map((day, idx) => (
                          <div key={`${a.id}-${idx}`} className="grid grid-cols-[1fr_auto] gap-2">
                            <select
                              className="w-full rounded-md border px-2 py-1 text-xs"
                              value={day}
                              onChange={(e) => {
                                const v = e.target.value;
                                setSmmDaysDraft((prev) => {
                                  const curr = prev[a.id] ?? parseSmmDays(a.link_pubblicazione);
                                  const next = [...curr];
                                  next[idx] = v;
                                  return { ...prev, [a.id]: next };
                                });
                              }}
                            >
                              <option value="">Giorno di pubblicazione</option>
                              <option value="lunedi">Ogni lunedì</option>
                              <option value="martedi">Ogni martedì</option>
                              <option value="mercoledi">Ogni mercoledì</option>
                              <option value="giovedi">Ogni giovedì</option>
                              <option value="venerdi">Ogni venerdì</option>
                              <option value="sabato">Ogni sabato</option>
                              <option value="domenica">Ogni domenica</option>
                            </select>
                            <button
                              className="h-8 rounded-md border border-zinc-300 px-3 text-xs text-zinc-700"
                              type="button"
                              onClick={() =>
                                setSmmDaysDraft((prev) => {
                                  const curr = prev[a.id] ?? parseSmmDays(a.link_pubblicazione);
                                  const next = curr.filter((_, i) => i !== idx);
                                  return { ...prev, [a.id]: next };
                                })
                              }
                              title="Rimuovi"
                            >
                              -
                            </button>
                          </div>
                        ))
                      )}
                      <button
                        className="h-8 rounded-md border border-zinc-300 px-3 text-xs text-zinc-700"
                        type="button"
                        onClick={() =>
                          setSmmDaysDraft((prev) => {
                            const curr = prev[a.id] ?? parseSmmDays(a.link_pubblicazione);
                            return { ...prev, [a.id]: [...curr, ""] };
                          })
                        }
                      >
                        + Aggiungi giorno
                      </button>
                    </div>
                    <button
                      className="h-8 rounded-md bg-green-600 px-3 text-xs text-white"
                      onClick={() => {
                        const rawNote = (document.getElementById(`smm-note-${a.id}`) as HTMLTextAreaElement)?.value ?? "";
                        const note_social = rawNote.trim() ? rawNote.trim().slice(0, 500) : null;
                        const days = (smmDaysDraft[a.id] ?? parseSmmDays(a.link_pubblicazione))
                          .map((d) => d.trim())
                          .filter(Boolean);
                        const giorno_pubblicazione = days.length > 0 ? Array.from(new Set(days)).join(",") : null;
                        onAssignSMMTask(a.id, note_social, giorno_pubblicazione);
                      }}
                      disabled={loading}
                    >
                      Assegna
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appuntamenti */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Appuntamenti</CardTitle>
            <button
              className="h-8 rounded-md bg-black px-3 text-xs text-white"
              onClick={() => setShowNewForm(true)}
            >
              Nuovo appuntamento
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {showNewForm && (
            <div className="mb-4 rounded-lg border p-3">
              <h3 className="text-sm font-semibold mb-3">Nuovo appuntamento</h3>
              <div className="space-y-2">
                <input
                  className="w-full rounded-md border px-2 py-1 text-xs"
                  placeholder="Cliente"
                  id="new-cliente"
                />
                <select className="w-full rounded-md border px-2 py-1 text-xs" id="new-stato">
                  <option value="potenziale">Potenziale</option>
                  <option value="chiuso">Chiuso</option>
                  <option value="in_prova">In prova</option>
                  <option value="perso">Perso</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="w-full rounded-md border px-2 py-1 text-xs"
                    type="date"
                    id="new-data-videocall-date"
                  />
                  <select
                    className="w-full rounded-md border px-2 py-1 text-xs"
                    id="new-data-videocall-time"
                    defaultValue=""
                  >
                    <option value="">Ora</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  className="w-full rounded-md border px-2 py-1 text-xs"
                  placeholder="Prezzo accordo"
                  type="number"
                  id="new-prezzo"
                />
                <input
                  className="w-full rounded-md border px-2 py-1 text-xs"
                  placeholder="Durata mesi"
                  type="number"
                  id="new-durata"
                />
                <input
                  className="w-full rounded-md border px-2 py-1 text-xs"
                  placeholder="Paese/Città"
                  id="new-paese-citta"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="w-full rounded-md border px-2 py-1 text-xs"
                    type="date"
                    id="new-data-shooting-date"
                  />
                  <select
                    className="w-full rounded-md border px-2 py-1 text-xs"
                    id="new-data-shooting-time"
                    defaultValue=""
                  >
                    <option value="">Ora</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  className="w-full rounded-md border px-2 py-1 text-xs"
                  placeholder="Note commerciali"
                  id="new-note-commerciali"
                />
                <textarea
                  className="w-full rounded-md border px-2 py-1 text-xs"
                  placeholder="Note video"
                  id="new-note-video"
                />
                <textarea
                  className="w-full rounded-md border px-2 py-1 text-xs"
                  placeholder="Note social"
                  id="new-note-social"
                />
                <input
                  className="w-full rounded-md border px-2 py-1 text-xs"
                  placeholder="Link pubblicazione"
                  id="new-link-pubblicazione"
                />
                <div className="flex gap-2">
                  <button
                    className="h-8 rounded-md bg-black px-3 text-xs text-white"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const cliente = (document.getElementById("new-cliente") as HTMLInputElement)?.value;
                      const stato = (document.getElementById("new-stato") as HTMLSelectElement)?.value;
                      const videocallDate = (document.getElementById("new-data-videocall-date") as HTMLInputElement)?.value || "";
                      const videocallTime = (document.getElementById("new-data-videocall-time") as HTMLSelectElement)?.value || "";
                      const data_videocall = videocallDate || videocallTime ? combineDateTime(videocallDate, videocallTime) : null;
                      const prezzo_accordo = Number((document.getElementById("new-prezzo") as HTMLInputElement)?.value) || null;
                      const durata_mesi = Number((document.getElementById("new-durata") as HTMLInputElement)?.value) || null;
                      const paese_citta = (document.getElementById("new-paese-citta") as HTMLInputElement)?.value || null;
                      const shootingDate = (document.getElementById("new-data-shooting-date") as HTMLInputElement)?.value || "";
                      const shootingTime = (document.getElementById("new-data-shooting-time") as HTMLSelectElement)?.value || "";
                      const data_shooting = shootingDate || shootingTime ? combineDateTime(shootingDate, shootingTime) : null;
                      const note_commerciali = (document.getElementById("new-note-commerciali") as HTMLTextAreaElement)?.value || null;
                      const note_video = (document.getElementById("new-note-video") as HTMLTextAreaElement)?.value || null;
                      const note_social = (document.getElementById("new-note-social") as HTMLTextAreaElement)?.value || null;
                      const link_pubblicazione = (document.getElementById("new-link-pubblicazione") as HTMLInputElement)?.value || null;
                      if (!cliente) {
                        setError("Cliente obbligatorio");
                        return;
                      }
                      if ((videocallDate || videocallTime) && !data_videocall) {
                        setError("Per la videocall inserisci sia giorno che ora");
                        return;
                      }
                      if ((shootingDate || shootingTime) && !data_shooting) {
                        setError("Per lo shooting inserisci sia giorno che ora");
                        return;
                      }
                      void onInsert({
                        cliente_nome: cliente,
                        stato,
                        data_videocall,
                        messaggio_originale_whatsapp: null,
                        note_commerciali,
                        prezzo_accordo,
                        durata_mesi,
                        file_contratto_url: null,
                        paese_citta,
                        data_shooting,
                        note_video,
                        note_social,
                        link_pubblicazione,
                      });
                    }}
                    disabled={loading}
                  >
                    {loading ? "Salvando..." : "Salva"}
                  </button>
                  <button
                    className="h-8 rounded-md border border-zinc-300 px-3 text-xs text-zinc-700"
                    onClick={() => setShowNewForm(false)}
                  >
                    Annulla
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {appointments.length === 0 ? (
              <p className="text-sm text-zinc-600">Nessun appuntamento.</p>
            ) : (
              appointments.map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{a.cliente_nome}</div>
                      <div className="flex gap-2">
                        <button
                          className="text-xs text-blue-600 underline"
                          onClick={() => (editingId === a.id ? cancelEdit(a.id) : startEdit(a))}
                        >
                          {editingId === a.id ? "Annulla" : "Modifica"}
                        </button>
                        <button
                          className="text-xs text-red-600 underline"
                          onClick={() => onDelete(a.id)}
                        >
                          Elimina
                        </button>
                      </div>
                    </div>

                    {editingId === a.id ? (
                      <div className="space-y-2">
                        {(() => {
                          const d = draftEdits[a.id] ?? {};
                          const vc = splitDateTime(typeof d.data_videocall === "string" ? d.data_videocall : a.data_videocall);
                          const sh = splitDateTime(typeof d.data_shooting === "string" ? d.data_shooting : a.data_shooting);

                          return (
                            <>
                        <input
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          placeholder="Cliente"
                          value={typeof d.cliente_nome === "string" ? d.cliente_nome : a.cliente_nome}
                          onChange={(e) =>
                            setDraftEdits((prev) => ({
                              ...prev,
                              [a.id]: { ...prev[a.id], cliente_nome: e.target.value },
                            }))
                          }
                        />
                        <select
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          value={typeof d.stato === "string" ? d.stato : a.stato}
                          onChange={(e) =>
                            setDraftEdits((prev) => ({
                              ...prev,
                              [a.id]: { ...prev[a.id], stato: e.target.value },
                            }))
                          }
                        >
                          <option value="potenziale">Potenziale</option>
                          <option value="chiuso">Chiuso</option>
                          <option value="in_prova">In prova</option>
                          <option value="perso">Perso</option>
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="w-full rounded-md border px-2 py-1 text-xs"
                            type="date"
                            value={vc.date}
                            onChange={(e) => {
                              const date = e.target.value || "";
                              const time = vc.time;
                              const combined = date || time ? combineDateTime(date, time) : null;
                              setDraftEdits((prev) => ({
                                ...prev,
                                [a.id]: { ...prev[a.id], data_videocall: combined },
                              }));
                            }}
                          />
                          <select
                            className="w-full rounded-md border px-2 py-1 text-xs"
                            value={vc.time}
                            onChange={(e) => {
                              const time = e.target.value || "";
                              const date = vc.date;
                              const combined = date || time ? combineDateTime(date, time) : null;
                              setDraftEdits((prev) => ({
                                ...prev,
                                [a.id]: { ...prev[a.id], data_videocall: combined },
                              }));
                            }}
                          >
                            <option value="">Ora</option>
                            {TIME_OPTIONS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <input
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          placeholder="Prezzo accordo"
                          type="number"
                          value={typeof d.prezzo_accordo === "number" ? String(d.prezzo_accordo) : a.prezzo_accordo ? String(a.prezzo_accordo) : ""}
                          onChange={(e) =>
                            setDraftEdits((prev) => ({
                              ...prev,
                              [a.id]: { ...prev[a.id], prezzo_accordo: Number(e.target.value) || null },
                            }))
                          }
                        />
                        <input
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          placeholder="Durata mesi"
                          type="number"
                          value={typeof d.durata_mesi === "number" ? String(d.durata_mesi) : a.durata_mesi ? String(a.durata_mesi) : ""}
                          onChange={(e) =>
                            setDraftEdits((prev) => ({
                              ...prev,
                              [a.id]: { ...prev[a.id], durata_mesi: Number(e.target.value) || null },
                            }))
                          }
                        />
                        <input
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          placeholder="Paese/Città"
                          value={typeof d.paese_citta === "string" ? d.paese_citta : a.paese_citta ?? ""}
                          onChange={(e) =>
                            setDraftEdits((prev) => ({
                              ...prev,
                              [a.id]: { ...prev[a.id], paese_citta: e.target.value || null },
                            }))
                          }
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="w-full rounded-md border px-2 py-1 text-xs"
                            type="date"
                            value={sh.date}
                            onChange={(e) => {
                              const date = e.target.value || "";
                              const time = sh.time;
                              const combined = date || time ? combineDateTime(date, time) : null;
                              setDraftEdits((prev) => ({
                                ...prev,
                                [a.id]: { ...prev[a.id], data_shooting: combined },
                              }));
                            }}
                          />
                          <select
                            className="w-full rounded-md border px-2 py-1 text-xs"
                            value={sh.time}
                            onChange={(e) => {
                              const time = e.target.value || "";
                              const date = sh.date;
                              const combined = date || time ? combineDateTime(date, time) : null;
                              setDraftEdits((prev) => ({
                                ...prev,
                                [a.id]: { ...prev[a.id], data_shooting: combined },
                              }));
                            }}
                          >
                            <option value="">Ora</option>
                            {TIME_OPTIONS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          placeholder="Note commerciali"
                          value={typeof d.note_commerciali === "string" ? d.note_commerciali : a.note_commerciali ?? ""}
                          onChange={(e) =>
                            setDraftEdits((prev) => ({
                              ...prev,
                              [a.id]: { ...prev[a.id], note_commerciali: e.target.value || null },
                            }))
                          }
                        />
                        <textarea
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          placeholder="Note video"
                          value={typeof d.note_video === "string" ? d.note_video : a.note_video ?? ""}
                          onChange={(e) =>
                            setDraftEdits((prev) => ({
                              ...prev,
                              [a.id]: { ...prev[a.id], note_video: e.target.value || null },
                            }))
                          }
                        />
                        <textarea
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          placeholder="Note social"
                          value={typeof d.note_social === "string" ? d.note_social : a.note_social ?? ""}
                          onChange={(e) =>
                            setDraftEdits((prev) => ({
                              ...prev,
                              [a.id]: { ...prev[a.id], note_social: e.target.value || null },
                            }))
                          }
                        />
                        <input
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          placeholder="Link pubblicazione"
                          value={typeof d.link_pubblicazione === "string" ? d.link_pubblicazione : a.link_pubblicazione ?? ""}
                          onChange={(e) =>
                            setDraftEdits((prev) => ({
                              ...prev,
                              [a.id]: { ...prev[a.id], link_pubblicazione: e.target.value || null },
                            }))
                          }
                        />
                        <div className="flex gap-2 pt-2">
                          <button
                            className="h-8 rounded-md bg-black px-3 text-xs text-white"
                            onClick={() => onSave(a.id, draftEdits[a.id] ?? {})}
                            disabled={loading}
                          >
                            Salva
                          </button>
                          <button
                            className="h-8 rounded-md border border-zinc-300 px-3 text-xs text-zinc-700"
                            onClick={() => cancelEdit(a.id)}
                            disabled={loading}
                          >
                            Annulla
                          </button>
                        </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <BadgeNeutral>{a.stato}</BadgeNeutral>
                          {a.prezzo_accordo ? (
                            <BadgeSuccess>€{a.prezzo_accordo}</BadgeSuccess>
                          ) : null}
                        </div>
                        <div className="text-xs text-zinc-600">
                          Videocall: {formatDateTimeIt(a.data_videocall)}
                        </div>
                        <div className="text-xs text-zinc-600">
                          Shooting: {formatDateTimeIt(a.data_shooting)}
                        </div>
                        <div className="text-xs text-zinc-600">
                          Paese/Città: {a.paese_citta ?? "-"}
                        </div>
                        <div className="text-xs text-zinc-600">
                          Note commerciali: {a.note_commerciali ?? "-"}
                        </div>
                        <div className="text-xs text-zinc-600">
                          Note video: {a.note_video ?? "-"}
                        </div>
                        <div className="text-xs text-zinc-600">
                          Note social: {a.note_social ?? "-"}
                        </div>
                        <div className="text-xs text-zinc-600">
                          Link pubblicazione: {a.link_pubblicazione ?? "-"}
                        </div>
                        {a.file_contratto_url && (
                          <a
                            href={a.file_contratto_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 underline"
                          >
                            Apri contratto
                          </a>
                        )}
                        <div className="flex gap-2 pt-2">
                          <button
                            className="h-8 rounded-md bg-blue-600 px-3 text-xs text-white"
                            onClick={() => onAssignToVideomaker(a.id)}
                          >
                            Assegna a Videomaker
                          </button>
                          <button
                            className="h-8 rounded-md bg-green-600 px-3 text-xs text-white"
                            onClick={() => onAssignToSMM(a.id)}
                          >
                            Assegna a SMM
                          </button>
                        </div>
                      </>
                    )}
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
