import type { Chat as ChatDTO, PlayerCharacter } from "@/types";

export function chatToDTO(db: any): ChatDTO {
  const splitCsv = (v?: string | null) =>
    (v ? v.split(",").map((s: string) => s.trim()).filter(Boolean) : []);
  const traits: string[] = Array.isArray(db.pcTraits) ? db.pcTraits : splitCsv(db.pcTraitsCsv);
  const skills: string[] = Array.isArray(db.pcSkills) ? db.pcSkills : splitCsv(db.pcSkillsCsv);

  return {
    id: db.id,
    title: db.title,
    storylineId: db.storylineId ?? null,
    createdAt: db.createdAt,
    updatedAt: db.updatedAt,
    pcName: db.pcName ?? null,
    pcRole: db.pcRole ?? null,
    pcBackground: db.pcBackground ?? null,
    pcGoals: db.pcGoals ?? null,
    pcEra: db.pcEra ?? null,
    pcAllegiances: db.pcAllegiances ?? null,
    pcTraits: traits,
    pcSkills: skills,
  };
}

export function pcToDbFields(pc: PlayerCharacter | null | undefined) {
  return {
    pcName: pc?.name ?? null,
    pcRole: pc?.role ?? null,
    pcBackground: pc?.background ?? null,
    pcGoals: pc?.goals ?? null,
    pcEra: pc?.era ?? null,
    pcAllegiances: pc?.allegiances ?? null,
    pcTraits: pc?.traits ?? [],
    pcSkills: pc?.skills ?? [],
  } as const;
}

export const pcToCsvFields = pcToDbFields;
