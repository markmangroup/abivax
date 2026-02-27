/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

function normalize(v) {
  return (v || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function argValue(name) {
  const i = process.argv.indexOf(name);
  if (i === -1) return "";
  return process.argv[i + 1] || "";
}

function main() {
  const root = path.resolve(__dirname, "..");
  const notesPath = path.join(root, "data", "abivax", "notes.json");
  const entitiesPath = path.join(root, "data", "abivax", "entities.json");
  const noteId = argValue("--note-id");
  const writeEntities = process.argv.includes("--write-entities");

  const notesData = loadJson(notesPath);
  const entitiesData = loadJson(entitiesPath);

  if (!Array.isArray(notesData.notes) || !Array.isArray(entitiesData.entities)) {
    throw new Error("Unexpected notes/entities schema");
  }

  const note = noteId
    ? notesData.notes.find((n) => n.id === noteId)
    : notesData.notes[0];

  if (!note) {
    throw new Error(noteId ? `Note not found: ${noteId}` : "No notes found");
  }

  const text = normalize(
    [
      note.title || "",
      note.rawText || "",
      ...(note.summary?.truthsNow || []),
      ...(note.summary?.decisions || []),
      ...(note.summary?.risks || []),
      ...(note.summary?.openQuestions || []),
      ...(note.summary?.nextConstraints || []),
    ].join("\n")
  );

  const mentioned = [];
  const updateQueue = [];
  const noteDate = note.createdAt ? new Date(note.createdAt) : new Date();
  const noteDateOnly = !Number.isNaN(noteDate.getTime())
    ? noteDate.toISOString().slice(0, 10)
    : "";

  for (const entity of entitiesData.entities) {
    const keys = [entity.name || "", ...(entity.aliases || [])]
      .map(normalize)
      .filter((k) => k && k.length >= 3);

    const isMentioned = keys.some((k) => {
      return text.includes(` ${k} `) || text.startsWith(`${k} `) || text.endsWith(` ${k}`) || text === k;
    });

    if (!isMentioned) continue;

    mentioned.push(entity.name || entity.id);

    if (writeEntities) {
      if (!Array.isArray(entity.mentions)) entity.mentions = [];
      const alreadyMentioned = entity.mentions.some((m) => m.noteId === note.id);
      if (!alreadyMentioned) {
        entity.mentions.push({
          noteId: note.id,
          date: noteDateOnly,
        });
      }
    }

    const entityUpdated = entity.updatedAt ? new Date(entity.updatedAt) : new Date(0);
    const needsReview =
      entity.type === "person" &&
      !Number.isNaN(entityUpdated.getTime()) &&
      !Number.isNaN(noteDate.getTime()) &&
      entityUpdated.getTime() < noteDate.getTime();

    if (needsReview) {
      updateQueue.push(`Review context for ${entity.name}`);
    }
  }

  note.summary = note.summary || {};
  note.summary.entityMentions = [...new Set(mentioned)].slice(0, 10);
  note.summary.entityUpdateQueue = [...new Set(updateQueue)].slice(0, 10);

  saveJson(notesPath, notesData);
  if (writeEntities) {
    saveJson(entitiesPath, entitiesData);
  }

  console.log(`Linked ${note.summary.entityMentions.length} entities for note ${note.id}`);
  if (note.summary.entityUpdateQueue.length) {
    console.log(`Update queue: ${note.summary.entityUpdateQueue.join("; ")}`);
  }
  console.log(`Entity mention writes: ${writeEntities ? "notes + entities" : "notes only"}`);
}

try {
  main();
} catch (err) {
  const msg = err && err.message ? err.message : String(err);
  console.error(`link_note_entities failed: ${msg}`);
  process.exit(1);
}
