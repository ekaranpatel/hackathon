/**
 * Parses "YYYY-MM-DD" and "09:00 AM - 10:00 AM" to return the slot's END Date object.
 */
function parseSlotEndTime(dateStr, timeSlotStr) {
  const parts = timeSlotStr.split('-');
  if (parts.length < 2) return null;

  const endTimeStr = parts[1].trim(); // e.g. "10:00 AM"
  const [time, modifier] = endTimeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0);
}

module.exports = { parseSlotEndTime };