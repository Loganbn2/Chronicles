export type Character = {
  id: string;
  name: string;
  role: string;
  background: string;
  goals?: string;
  traits?: string[];
};

export type Storyline = {
  id: string;
  title: string;
  era: string;
  location?: string;
  description: string;
  starterHook: string;
  safetyTools?: string[];
  characters: Character[];
};

export type PlayerCharacter = Omit<Character, "id"> & { era?: string; allegiances?: string; skills?: string[] };

export type Role = "system" | "user" | "assistant";

export type Message = {
  id: string;
  role: Role;
  content: string;
  timestamp?: number;
};

// Persisted chat record snapshot (DTO shape)
export type Chat = {
  id: string;
  title: string;
  storylineId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  pcName?: string | null;
  pcRole?: string | null;
  pcBackground?: string | null;
  pcGoals?: string | null;
  pcEra?: string | null;
  pcAllegiances?: string | null;
  pcTraits?: string[];
  pcSkills?: string[];
};

// API helpers
export type CreateChatInput = {
  title?: string;
  storylineId?: string;
  pc?: PlayerCharacter | null;
};

export type CreateMessageInput = {
  id: string;
  role: Role;
  content: string;
};
