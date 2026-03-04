import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2 className={cn("text-base font-semibold text-zinc-900", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />;
}
