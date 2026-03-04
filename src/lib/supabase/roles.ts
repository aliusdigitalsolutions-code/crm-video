export type UserRole = "admin" | "rappresentante" | "videomaker" | "smm";

export function roleHomePath(role: UserRole) {
  switch (role) {
    case "rappresentante":
      return "/dashboard-vendite";
    case "videomaker":
      return "/agenda-shooting";
    case "smm":
      return "/gestione-social";
    case "admin":
    default:
      return "/admin";
  }
}
