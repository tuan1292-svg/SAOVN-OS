// Legacy Member Work fallback intentionally disabled.
// The governed work-v3.js module is the single owner of Work task loading and
// rendering. Keeping a second Firebase reader here caused competing renders,
// permission noise, and could overwrite a successful Work result.
export {};
