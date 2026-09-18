export type Role = "guest" | "member" | "professional" | "staff";

export function isRole(value: string): value is Role {
  return value === "guest" || value === "member" || value === "professional" || value === "staff";
}

export function professionalUnlocked(role: Role, amr: string[] | undefined): boolean {
  if (role !== "professional" && role !== "staff") return false;
  return Boolean(amr?.includes("otp"));
}

export function canShareReports(role: Role): boolean {
  return role === "member" || role === "professional" || role === "staff" || role === "guest";
}
