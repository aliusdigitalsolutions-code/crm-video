import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
        className,
      )}
      {...props}
    />
  );
}

export function BadgeSuccess({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <Badge
      className={cn(
        "border-green-200 bg-green-50 text-green-700",
        className,
      )}
      {...props}
    />
  );
}

export function BadgeWarning({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <Badge
      className={cn(
        "border-yellow-200 bg-yellow-50 text-yellow-700",
        className,
      )}
      {...props}
    />
  );
}

export function BadgeNeutral({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <Badge
      className={cn(
        "border-zinc-200 bg-zinc-50 text-zinc-700",
        className,
      )}
      {...props}
    />
  );
}
