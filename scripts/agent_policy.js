/* eslint-disable @typescript-eslint/no-require-imports */

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isPlaceholderPerson(entity) {
  const id = normalize(entity?.id || "");
  const name = normalize(entity?.name || "");
  return (
    id.startsWith("france-room-attendee-") ||
    name.includes("attendee") ||
    name.includes("unknown")
  );
}

function isExternalContact(entity) {
  const role = normalize(entity?.properties?.role || "");
  const org = normalize(entity?.properties?.org || entity?.properties?.entity || "");
  const notes = normalize(entity?.notes || "");
  return (
    role.includes("consultant") ||
    role.includes("advisor") ||
    role.includes("oracle") ||
    role.includes("kpmg") ||
    role.includes("vendor") ||
    org.includes("external") ||
    org.includes("oracle") ||
    org.includes("kpmg") ||
    notes.includes("oracle") ||
    notes.includes("kpmg")
  );
}

function isSelfEntity(entity) {
  const id = normalize(entity?.id || "");
  const name = normalize(entity?.name || "");
  return id === "mike-markman" || name === "michael markman" || name === "mike markman";
}

function isTopExecRole(entity) {
  const role = normalize(entity?.properties?.role || "");
  return (
    role.includes("chief executive officer") ||
    role.includes(" ceo") ||
    role.startsWith("ceo") ||
    role.includes("chief financial officer") ||
    role.includes(" cfo") ||
    role.startsWith("cfo") ||
    role.includes("board secretary")
  );
}

function shouldSuppressFromPrompts(entity) {
  const id = normalize(entity?.id || "");
  return (
    isPlaceholderPerson(entity) ||
    isExternalContact(entity) ||
    isSelfEntity(entity) ||
    isTopExecRole(entity) ||
    id === "denis"
  );
}

module.exports = {
  normalize,
  isPlaceholderPerson,
  isExternalContact,
  isSelfEntity,
  isTopExecRole,
  shouldSuppressFromPrompts,
};
