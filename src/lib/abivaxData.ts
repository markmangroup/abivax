import { readFileSync } from "fs";
import path from "path";
import { z } from "zod";

// --- Schemas ---

const SpineStateSchema = z.object({
  identity: z.string(),
  campaign: z.string(),
  quarterLeverage: z.array(z.string()),
  personalRisks: z.array(z.string()),
  oneLineStandard: z.string(),
});

// --- Entity System (Unified Knowledge Base) ---

export const EntityTypeEnum = z.enum([
  "person",
  "system",
  "meeting",
  "decision",
  "concept",
  "milestone",
  "organization",
]);

export type EntityType = z.infer<typeof EntityTypeEnum>;

const EntityMentionSchema = z.object({
  noteId: z.string(),
  date: z.string(),
  context: z.string().optional(),
});

const EntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: EntityTypeEnum,
  aliases: z.array(z.string()).default([]),
  description: z.string().optional(),
  properties: z.record(z.string(), z.unknown()).default({}),
  links: z.array(z.string()).default([]),
  notes: z.string().optional(),
  mentions: z.array(EntityMentionSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const EntitiesDataSchema = z.object({
  entities: z.array(EntitySchema),
});

export type EntityMention = z.infer<typeof EntityMentionSchema>;
export type Entity = z.infer<typeof EntitySchema>;
export type EntitiesData = z.infer<typeof EntitiesDataSchema>;

const NoteSummarySchema = z.object({
  truthsNow: z.array(z.string()).max(5).optional().default([]),
  decisions: z.array(z.string()).max(5).optional().default([]),
  risks: z.array(z.string()).max(5).optional().default([]),
  openQuestions: z.array(z.string()).max(5).optional().default([]),
  nextConstraints: z.array(z.string()).max(5).optional().default([]),
});

const NoteSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  title: z.string().optional(),
  rawText: z.string(),
  summary: NoteSummarySchema.optional().default({
    truthsNow: [],
    decisions: [],
    risks: [],
    openQuestions: [],
    nextConstraints: [],
  }),
});

const NotesDataSchema = z.object({
  notes: z.array(NoteSchema),
});

const PersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  entity: z.string(),
  needThem: z.string(),
  notes: z.string(),
});

const PeopleDataSchema = z.object({
  people: z.array(PersonSchema),
});

const MilestoneSchema = z.object({
  id: z.string(),
  date: z.string().nullable(),
  label: z.string(),
  scope: z.string(),
  status: z.string(),
  notes: z.string(),
});

const TimelineDataSchema = z.object({
  milestones: z.array(MilestoneSchema),
});

const BudgetDataSchema = z.object({
  sapOffer: z.object({
    total5yr: z.number(),
    currency: z.string(),
    aacv: z.number(),
    validUntil: z.string(),
    terms: z.array(z.string()),
    modules: z.array(z.string()),
  }),
  keyNumbers: z.array(
    z.object({ label: z.string(), value: z.string() })
  ),
});

const MeetingSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  time: z.string(),
  location: z.string(),
  organizer: z.string(),
  attendees: z.string(),
  purpose: z.string(),
  prep: z.array(z.string()),
  link: z.string().optional(),
});

const MeetingsDataSchema = z.object({
  meetings: z.array(MeetingSchema),
});

export type SpineState = z.infer<typeof SpineStateSchema>;
export type NoteSummary = z.infer<typeof NoteSummarySchema>;
export type Note = z.infer<typeof NoteSchema>;
export type NotesData = z.infer<typeof NotesDataSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type PeopleData = z.infer<typeof PeopleDataSchema>;
export type Milestone = z.infer<typeof MilestoneSchema>;
export type TimelineData = z.infer<typeof TimelineDataSchema>;
export type BudgetData = z.infer<typeof BudgetDataSchema>;
export type Meeting = z.infer<typeof MeetingSchema>;
export type MeetingsData = z.infer<typeof MeetingsDataSchema>;

const DATA_DIR = path.join(process.cwd(), "data", "abivax");

function loadJsonFile<T>(filename: string, schema: z.ZodType<T>): T {
  const filePath = path.join(DATA_DIR, filename);
  const content = readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(content) as unknown;
  return schema.parse(parsed);
}

export function loadSpineState(): SpineState {
  return loadJsonFile("spine_state.json", SpineStateSchema);
}

export function loadNotes(): NotesData {
  return loadJsonFile("notes.json", NotesDataSchema);
}

export function loadPeople(): PeopleData {
  return loadJsonFile("people.json", PeopleDataSchema);
}

export function loadTimeline(): TimelineData {
  return loadJsonFile("timeline.json", TimelineDataSchema);
}

export function loadBudget(): BudgetData {
  return loadJsonFile("budget.json", BudgetDataSchema);
}

export function loadMeetings(): MeetingsData {
  return loadJsonFile("meetings.json", MeetingsDataSchema);
}

export function loadEntities(): EntitiesData {
  return loadJsonFile("entities.json", EntitiesDataSchema);
}

export function getEntityBySlug(slug: string): Entity | undefined {
  const { entities } = loadEntities();
  return entities.find((e) => e.id === slug);
}

export function getEntitiesByType(type: EntityType): Entity[] {
  const { entities } = loadEntities();
  return entities.filter((e) => e.type === type);
}

export function getLinkedEntities(entityId: string): Entity[] {
  const { entities } = loadEntities();
  const entity = entities.find((e) => e.id === entityId);
  if (!entity) return [];
  return entities.filter((e) => entity.links.includes(e.id));
}

export function getBacklinks(entityId: string): Entity[] {
  const { entities } = loadEntities();
  return entities.filter((e) => e.links.includes(entityId));
}

export function searchEntities(query: string): Entity[] {
  const { entities } = loadEntities();
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return entities
    .map((entity) => {
      let score = 0;
      const nameMatch = entity.name.toLowerCase().includes(q);
      const aliasMatch = entity.aliases.some((a) => a.toLowerCase().includes(q));
      const descMatch = entity.description?.toLowerCase().includes(q);
      const notesMatch = entity.notes?.toLowerCase().includes(q);
      const propsMatch = JSON.stringify(entity.properties).toLowerCase().includes(q);

      if (entity.name.toLowerCase() === q) score += 100;
      else if (nameMatch) score += 50;
      if (aliasMatch) score += 40;
      if (descMatch) score += 20;
      if (notesMatch) score += 10;
      if (propsMatch) score += 5;

      return { entity, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.entity);
}
