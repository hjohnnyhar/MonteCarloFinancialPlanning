// src/lib/generatePlanId.ts

export function generatePlanId(name: string): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return name.trim().replace(/\s+/g, '') + mm + dd + yyyy;
}
