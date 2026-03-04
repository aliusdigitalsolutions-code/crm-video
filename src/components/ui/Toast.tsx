import { cn } from "@/lib/utils";

export function Toast({ className, variant = "default", ...props }: React.ComponentProps<"div"> & { variant?: "default" | "error" | "success" }) {
  const base = "rounded-md border px-3 py-2 text-sm";
  const variants = {
    default: "border-zinc-200 bg-zinc-50 text-zinc-700",
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-green-200 bg-green-50 text-green-700",
  };
  return (
    <div className={cn(base, variants[variant], className)} {...props} />
  );
}
