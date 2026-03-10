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
  const date = d.toISOString().slice(0, 10);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { date, time };
}

function combineDateTime(date: string, time: string) {
  if (!date) return null;
  if (!time) return null;
  return `${date}T${time}:00`;
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
  const [showNewForm, setShowNewForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    } catch (e) {
      setError(formatSupabaseError(e));
    } finally {
      setLoading(false);
    }
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
      const { data: inserted, error: insertError } = await supabase
        .from("appointments")
        .insert(newAppointment)
        .select("*")
        .single();
      if (insertError) throw insertError;

      if (inserted) {
        setAppointments((prev) => [inserted as Appointment, ...prev]);
      } else {
        const { data } = await supabase
          .from("appointments")
          .select("*")
          .order("created_at", { ascending: false });
        setAppointments(data ?? []);
      }
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
                    <input
                      className="w-full rounded-md border px-2 py-1 text-xs"
                      placeholder="Link pubblicazione"
                      id={`smm-link-${a.id}`}
                      defaultValue={a.link_pubblicazione ?? ""}
                    />
                    <button
                      className="h-8 rounded-md bg-green-600 px-3 text-xs text-white"
                      onClick={() => {
                        const note_social = (document.getElementById(`smm-note-${a.id}`) as HTMLTextAreaElement)?.value || null;
                        const link_pubblicazione = (document.getElementById(`smm-link-${a.id}`) as HTMLInputElement)?.value || null;
                        onAssignSMMTask(a.id, note_social, link_pubblicazione);
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
                    onClick={() => {
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
                      onInsert({
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
                          onClick={() => setEditingId(editingId === a.id ? null : a.id)}
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
                        <input
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          placeholder="Cliente"
                          defaultValue={a.cliente_nome}
                          onBlur={(e) => onSave(a.id, { cliente_nome: e.target.value })}
                        />
                        <select
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          defaultValue={a.stato}
                          onChange={(e) => onSave(a.id, { stato: e.target.value })}
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
                            defaultValue={splitDateTime(a.data_videocall).date}
                            onBlur={(e) => {
                              const date = e.target.value || "";
                              const time = (e.target.parentElement?.querySelector("select") as HTMLSelectElement | null)?.value || splitDateTime(a.data_videocall).time;
                              const combined = date || time ? combineDateTime(date, time) : null;
                              onSave(a.id, { data_videocall: combined });
                            }}
                          />
                          <select
                            className="w-full rounded-md border px-2 py-1 text-xs"
                            defaultValue={splitDateTime(a.data_videocall).time}
                            onChange={(e) => {
                              const time = e.target.value || "";
                              const date = (e.target.parentElement?.querySelector("input[type='date']") as HTMLInputElement | null)?.value || splitDateTime(a.data_videocall).date;
                              const combined = date || time ? combineDateTime(date, time) : null;
                              onSave(a.id, { data_videocall: combined });
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
                          defaultValue={a.prezzo_accordo ?? ""}
                          onBlur={(e) => onSave(a.id, { prezzo_accordo: Number(e.target.value) || null })}
                        />
                        <input
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          placeholder="Durata mesi"
                          type="number"
                          defaultValue={a.durata_mesi ?? ""}
                          onBlur={(e) => onSave(a.id, { durata_mesi: Number(e.target.value) || null })}
                        />
                        <input
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          placeholder="Paese/Città"
                          defaultValue={a.paese_citta ?? ""}
                          onBlur={(e) => onSave(a.id, { paese_citta: e.target.value || null })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="w-full rounded-md border px-2 py-1 text-xs"
                            type="date"
                            defaultValue={splitDateTime(a.data_shooting).date}
                            onBlur={(e) => {
                              const date = e.target.value || "";
                              const time = (e.target.parentElement?.querySelector("select") as HTMLSelectElement | null)?.value || splitDateTime(a.data_shooting).time;
                              const combined = date || time ? combineDateTime(date, time) : null;
                              onSave(a.id, { data_shooting: combined });
                            }}
                          />
                          <select
                            className="w-full rounded-md border px-2 py-1 text-xs"
                            defaultValue={splitDateTime(a.data_shooting).time}
                            onChange={(e) => {
                              const time = e.target.value || "";
                              const date = (e.target.parentElement?.querySelector("input[type='date']") as HTMLInputElement | null)?.value || splitDateTime(a.data_shooting).date;
                              const combined = date || time ? combineDateTime(date, time) : null;
                              onSave(a.id, { data_shooting: combined });
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
                          defaultValue={a.note_commerciali ?? ""}
                          onBlur={(e) => onSave(a.id, { note_commerciali: e.target.value || null })}
                        />
                        <textarea
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          placeholder="Note video"
                          defaultValue={a.note_video ?? ""}
                          onBlur={(e) => onSave(a.id, { note_video: e.target.value || null })}
                        />
                        <textarea
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          placeholder="Note social"
                          defaultValue={a.note_social ?? ""}
                          onBlur={(e) => onSave(a.id, { note_social: e.target.value || null })}
                        />
                        <input
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          placeholder="Link pubblicazione"
                          defaultValue={a.link_pubblicazione ?? ""}
                          onBlur={(e) => onSave(a.id, { link_pubblicazione: e.target.value || null })}
                        />
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
