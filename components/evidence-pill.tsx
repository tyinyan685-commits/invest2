import type { EvidenceStrength } from "@/lib/data/demo";

export function EvidencePill({ strength }: { strength: EvidenceStrength }) {
  return <span className={`evidence-pill evidence-${strength}`}>证据 {strength}</span>;
}
