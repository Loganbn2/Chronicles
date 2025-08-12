import type { Chat as ChatDTO, PlayerCharacter } from "@/types";

type ChatRow = {
  id: string;
  title: string;
  storylineId: string | null;
  createdAt: Date;
  updatedAt: Date;
  pcName?: string | null;
  pcRole?: string | null;
  pcBackground?: string | null;
  pcGoals?: string | null;
  pcEra?: string | null;
  pcAllegiances?: string | null;
  pcTraits?: string[] | null;
  pcSkills?: string[] | null;
  pcTraitsCsv?: string | null;
  pcSkillsCsv?: string | null;
};

export function chatToDTO(db: ChatRow): ChatDTO {
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
