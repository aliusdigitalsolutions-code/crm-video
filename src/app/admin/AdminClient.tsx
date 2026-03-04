"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BadgeSuccess, BadgeNeutral, BadgeWarning } from "@/components/ui/Badge";
import { Toast } from "@/components/ui/Toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

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
      const { error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      );
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
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
      setError(e instanceof Error ? e.message : "Delete failed");
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
    await onSave(id, { paese_citta, data_shooting, note_video });
  }

  async function onAssignSMMTask(id: string, note_social: string | null, link_pubblicazione: string | null) {
    await onSave(id, { note_social, link_pubblicazione });
  }

  async function onInsert(newAppointment: Omit<Appointment, "id" | "created_at">) {
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.from("appointments").insert(newAppointment);
      if (error) throw error;
      // Ricarica tutti gli appuntamenti
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .order("created_at", { ascending: false });
      setAppointments(data ?? []);
      setShowNewForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Insert failed");
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
                    <input
                      className="w-full rounded-md border px-2 py-1 text-xs"
                      placeholder="Data shooting (ISO)"
                      id={`videomaker-data-${a.id}`}
                      defaultValue={a.data_shooting ?? ""}
                    />
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
                        const data_shooting = (document.getElementById(`videomaker-data-${a.id}`) as HTMLInputElement)?.value || null;
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
                <input
                  className="w-full rounded-md border px-2 py-1 text-xs"
                  placeholder="Data videocall (ISO)"
                  id="new-data-videocall"
                />
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
                <input
                  className="w-full rounded-md border px-2 py-1 text-xs"
                  placeholder="Data shooting (ISO)"
                  id="new-data-shooting"
                />
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
                      const data_videocall = (document.getElementById("new-data-videocall") as HTMLInputElement)?.value || null;
                      const prezzo_accordo = Number((document.getElementById("new-prezzo") as HTMLInputElement)?.value) || null;
                      const durata_mesi = Number((document.getElementById("new-durata") as HTMLInputElement)?.value) || null;
                      const paese_citta = (document.getElementById("new-paese-citta") as HTMLInputElement)?.value || null;
                      const data_shooting = (document.getElementById("new-data-shooting") as HTMLInputElement)?.value || null;
                      const note_commerciali = (document.getElementById("new-note-commerciali") as HTMLTextAreaElement)?.value || null;
                      const note_video = (document.getElementById("new-note-video") as HTMLTextAreaElement)?.value || null;
                      const note_social = (document.getElementById("new-note-social") as HTMLTextAreaElement)?.value || null;
                      const link_pubblicazione = (document.getElementById("new-link-pubblicazione") as HTMLInputElement)?.value || null;
                      if (!cliente) {
                        setError("Cliente obbligatorio");
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
                        <input
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          placeholder="Data videocall (ISO)"
                          defaultValue={a.data_videocall ?? ""}
                          onBlur={(e) => onSave(a.id, { data_videocall: e.target.value || null })}
                        />
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
                        <input
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          placeholder="Data shooting (ISO)"
                          defaultValue={a.data_shooting ?? ""}
                          onBlur={(e) => onSave(a.id, { data_shooting: e.target.value || null })}
                        />
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
                          Videocall: {a.data_videocall ?? "-"}
                        </div>
                        <div className="text-xs text-zinc-600">
                          Shooting: {a.data_shooting ?? "-"}
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
