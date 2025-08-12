import { Storyline } from "@/types";

export const storylines: Storyline[] = [
  {
    id: "roman-republic",
    title: "Shadows of the Republic",
    era: "Late Roman Republic (63–44 BCE)",
    location: "Rome, Sicily, and the Eastern Provinces",
    description:
      "Political intrigue, omens, and war echo through the streets as the Republic teeters. Navigate senatorial conspiracies, legions' loyalties, and the rise of strongmen.",
    starterHook:
      "A forged oracle tablet implicates your patron in sacrilege against the Sibylline Books. Clear their name before the Senate convenes.",
    safetyTools: ["Lines & Veils", "X-Card", "Open Door"],
    characters: [
      {
        id: "cicero",
        name: "Marcus Tullius Cicero",
        role: "Orator and Consul",
        background:
          "A brilliant lawyer and statesman, navigating enemies among populares and optimates alike.",
        goals: "Preserve the Republic and personal legacy.",
        traits: ["eloquent", "cautious", "patriotic"],
      },
      {
        id: "caesar",
        name: "Gaius Julius Caesar",
        role: "General and Statesman",
        background:
          "Charismatic commander whose ambition and debts drive risky gambits in Gaul and Rome.",
        goals: "Secure imperium and reshape Rome.",
        traits: ["ambitious", "charismatic", "strategic"],
      },
      {
        id: "cleopatra",
        name: "Cleopatra VII Philopator",
        role: "Queen of Egypt",
        background:
          "Polyglot diplomat queen balancing Rome's factions while safeguarding Alexandria's wealth.",
        goals: "Protect Egypt's sovereignty.",
        traits: ["diplomatic", "erudite", "resolute"],
      },
    ],
  },
  {
    id: "heian-court",
    title: "Whispers by Lanternlight",
    era: "Heian Japan (11th century)",
    location: "Kyoto",
    description:
      "Calligraphy, poetry, and politics entwine behind beaded curtains. Reputation is currency; secrets are blades.",
    starterHook:
      "A waka poem left on your screen hints at a scandal that could upend a powerful clan's marriage politics.",
    safetyTools: ["Lines & Veils", "Open Door"],
    characters: [
      {
        id: "sei-shonagon",
        name: "Sei Shōnagon",
        role: "Lady-in-waiting and Writer",
        background:
          "Wit like lacquered steel; observes everything and records lists that unsettle the court.",
        traits: ["observant", "acerbic", "refined"],
      },
      {
        id: "michinaga",
        name: "Fujiwara no Michinaga",
        role: "Court Regent",
        background:
          "Master of marriage alliances whose smile conceals ruthless arithmetic of power.",
        traits: ["calculating", "charming", "patient"],
      },
    ],
  },
  {
    id: "harlem-renaissance",
    title: "Midnight on Lenox",
    era: "Harlem Renaissance (1920s)",
    location: "New York City",
    description:
      "Jazz, zoot suits, and rent parties hum while patrons, poets, and policemen test the limits of a new age.",
    starterHook:
      "A lost manuscript surfaces, claimed by two rival poets and a suspicious publisher with mob ties.",
    safetyTools: ["Lines & Veils", "Open Door"],
    characters: [
      {
        id: "langston",
        name: "Langston Hughes",
        role: "Poet",
        background: "Voice of a people, equally at home on rail cars and in salons.",
        traits: ["wry", "empathetic", "steady"],
      },
      {
        id: "zora",
        name: "Zora Neale Hurston",
        role: "Anthropologist and Writer",
        background: "Collector of stories with a bite and a grin.",
        traits: ["curious", "fearless", "incisive"],
      },
    ],
  },
];
