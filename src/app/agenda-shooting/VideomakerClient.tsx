"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BadgeSuccess, BadgeNeutral } from "@/components/ui/Badge";
import { Toast } from "@/components/ui/Toast";

export default function VideomakerClient(props: { initial: any[] }) {
  const [items, setItems] = useState(props.initial);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onUpload(appointmentId: string, file: File) {
    setError(null);
    setUploadingId(appointmentId);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("appointmentId", appointmentId);

    try {
      const res = await fetch("/api/upload-contratto", {
        method: "POST",
        body: formData,
      });

      const json = (await res.json()) as
        | { fileUrl: string }
        | { error: string };

      if (!res.ok) {
        const message = "error" in json ? json.error : "Upload failed";
        setError(message);
        return;
      }

      if ("fileUrl" in json) {
        setItems((prev) =>
          prev.map((a) =>
            a.id === appointmentId
              ? { ...a, file_contratto_url: json.fileUrl }
              : a,
          ),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Clienti chiusi (da girare al videomaker)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-zinc-600">Nessun cliente chiuso.</p>
            ) : (
              items.map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-semibold">{a.cliente_nome}</div>
                    <div className="text-xs text-zinc-600">Paese/Città: {a.paese_citta ?? "-"}</div>
                    <div className="text-xs text-zinc-600">Note video: {a.note_video ?? "-"}</div>
                    <div className="text-xs text-zinc-600">Data shooting: {a.data_shooting ?? "-"}</div>
                    {a.file_contratto_url ? (
                      <a
                        href={a.file_contratto_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline"
                      >
                        Apri contratto
                      </a>
                    ) : (
                      <div className="mt-2">
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          className="text-xs"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onUpload(a.id, file);
                          }}
                          disabled={uploadingId === a.id}
                        />
                        {uploadingId === a.id && (
                          <span className="ml-2 text-xs text-zinc-600">Uploading...</span>
                        )}
                      </div>
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
