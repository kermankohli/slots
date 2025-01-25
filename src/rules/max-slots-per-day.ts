import { Slot } from '../types';
import { SlotRule } from '../types';

/**
 * Creates a rule that limits the number of slots per day
 */
export const maxSlotsPerDayRule = (maxSlots: number): SlotRule => (slots) => {
  // Group slots by day
  const slotsByDay = new Map<string, Slot[]>();
  
  // Group slots by day
  slots.forEach(slot => {
    const day = slot.start.startOf('day').toISO() || '';
    if (!slotsByDay.has(day)) {
      slotsByDay.set(day, []);
    }
    slotsByDay.get(day)!.push(slot);
  });

  // For each day that has > maxSlots, return the excess slots as forbidden
  return Array.from(slotsByDay.entries())
    .flatMap(([_, daySlots]) => {
      if (daySlots.length > maxSlots) {
        return daySlots
          .sort((a, b) => a.start.toMillis() - b.start.toMillis())
          .slice(maxSlots);
      }
      return [];
    });
}; 