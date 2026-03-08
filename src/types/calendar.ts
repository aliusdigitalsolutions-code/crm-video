export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    cliente_nome: string;
    stato: string;
    tipo: "videocall" | "shooting" | "pubblicazione";
    note?: string | null | undefined;
    full_data?: any;
  };
};
