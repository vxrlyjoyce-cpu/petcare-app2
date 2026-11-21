export const petTypes = ['dog','cat','rabbit','bird','fish','reptile','rodent','other'];
export const logTypes = ['feeding','walk','meds','weight','grooming'];
export const categories = ['Vet visit','Vaccination','Grooming','Medication','Other'];
export const validPhoto = value => !value || /^\/api\/photos\/[\da-f-]{36}$/.test(value);

export function validState(state) {
  if (!state || !Array.isArray(state.pets) || state.pets.length > 100 || !Array.isArray(state.logs) || state.logs.length > 25000 || !Array.isArray(state.reminders) || state.reminders.length > 5000) return false;
  const text = (value, limit = 2000) => typeof value === 'string' && value.length <= limit;
  const optional = (value, limit) => value == null || text(value, limit);
  const id = value => typeof value === 'string' && /^[\w-]{1,100}$/.test(value);
  const date = value => /^\d{4}-\d\d-\d\d$/.test(value) && Number.isFinite(Date.parse(value));
  const distinct = rows => rows.every(row => row && id(row.id)) && new Set(rows.map(row => row.id)).size === rows.length;
  if (![state.pets,state.logs,state.reminders].every(distinct)) return false;
  const ids = new Set(state.pets.map(pet => pet.id));
  return (state.selectedPetId == null || ids.has(state.selectedPetId)) && state.pets.every(pet => text(pet.name, 80) && pet.name.trim() && petTypes.includes(pet.type) && optional(pet.breed,120) && optional(pet.notes,2000) && (!pet.birthdate || date(pet.birthdate)) && (pet.weight == null || (Number.isFinite(pet.weight) && pet.weight >= 0 && pet.weight < 100000)) && validPhoto(pet.photo)) && state.logs.every(log => ids.has(log.petId) && logTypes.includes(log.type) && text(log.title,160) && log.title.trim() && text(log.datetime,30) && /^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(log.datetime) && Number.isFinite(Date.parse(log.datetime)) && optional(log.detail,300) && optional(log.notes,2000) && optional(log.mood,100) && (log.type !== 'weight' || (Number.isFinite(log.numericValue) && log.numericValue > 0 && log.numericValue < 100000))) && state.reminders.every(rem => ids.has(rem.petId) && text(rem.title,160) && rem.title.trim() && text(rem.category,80) && date(rem.date) && optional(rem.notes,2000) && typeof rem.completed === 'boolean');
}
