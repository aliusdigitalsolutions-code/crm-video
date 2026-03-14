export type UserRole = "admin" | "rappresentante" | "videomaker" | "videomaker_bari" | "smm";

export function roleHomePath(role: UserRole) {
  switch (role) {
    case "rappresentante":
      return "/dashboard-vendite";
    case "videomaker":
      return "/agenda-shooting";
    case "videomaker_bari":
      return "/agenda-shooting-bari";
    case "smm":
      return "/gestione-social";
    case "admin":
    default:
      return "/admin";
  }
}
