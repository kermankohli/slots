import { Slot } from '../types';
import { SlotRule } from '../types';

/**
 * Base weekday rule that handles both keeping and removing weekdays
 * @param weekdays - Array of weekday numbers (1-7, where 1 is Monday and 7 is Sunday)
 * @param shouldKeep - If true, keep slots on specified weekdays. If false, remove them.
 * @returns A rule that returns slots that should be removed
 */
const createWeekdayRule = (weekdays: number[], shouldKeep: boolean): SlotRule => (slots) => {
  // If no weekdays specified, keep all slots
  if (weekdays.length === 0) {
    return [];
  }

  return slots.filter(slot => {
    const weekday = slot.start.weekday;
    // For keep: return slots NOT in weekdays (to be removed)
    // For remove: return slots IN weekdays (to be removed)
    return shouldKeep ? !weekdays.includes(weekday) : weekdays.includes(weekday);
  });
};

/**
 * Creates a rule that keeps only slots on specified weekdays
 * @param weekdays - Array of weekday numbers to keep (1-7, where 1 is Monday and 7 is Sunday)
 * If empty, all weekdays are kept
 * @returns A rule that returns slots that should be removed (those not on specified weekdays)
 */
export const keepWeekdaysRule = (weekdays: number[] = []): SlotRule => 
  createWeekdayRule(weekdays, true);

/**
 * Creates a rule that removes slots on specified weekdays
 * @param weekdays - Array of weekday numbers to remove (1-7, where 1 is Monday and 7 is Sunday)
 * If empty, no weekdays are removed
 * @returns A rule that returns slots that should be removed (those on specified weekdays)
 */
export const removeWeekdaysRule = (weekdays: number[] = []): SlotRule =>
  createWeekdayRule(weekdays, false);

// Convenience functions for common use cases
export const keepWeekdaysOnlyRule = (weekdays: number[] = []): SlotRule =>
  keepWeekdaysRule(weekdays);

export const removeWeekendsRule = (): SlotRule =>
  removeWeekdaysRule([6, 7]);