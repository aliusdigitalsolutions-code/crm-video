import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

type Appointment = {
  id: string;
  created_at: string;
  cliente_nome: string;
  stato: string;
  data_videocall: string | null;
  note_commerciali: string | null;
  messaggio_originale_whatsapp: string | null;
};

export default function RepresentanteClient(props: { initial: Appointment[] }) {
  const items = props.initial;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>I tuoi appuntamenti</CardTitle>
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
