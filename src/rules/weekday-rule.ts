import { Slot } from '../types';
import { SlotRule } from '../types';

/**
 * Base weekday rule that handles both allowing and forbidding weekdays
 * @param weekdays - Array of weekday numbers (1-7, where 1 is Monday and 7 is Sunday)
 * @param isAllowList - If true, weekdays array is treated as allowed days. If false, as forbidden days.
 * @returns A rule that returns slots that should be forbidden
 */
const createWeekdayRule = (weekdays: number[], isAllowList: boolean): SlotRule => (slots) => {
  // If no weekdays specified, allow all slots
  if (weekdays.length === 0) {
    return [];
  }

  return slots.filter(slot => {
    const weekday = slot.start.weekday;
    // For allow list: return slots NOT in weekdays
    // For forbid list: return slots IN weekdays
    return isAllowList ? !weekdays.includes(weekday) : weekdays.includes(weekday);
  });
};

/**
 * Creates a rule that only allows specified weekdays
 * @param allowedWeekdays - Array of allowed weekday numbers (1-7, where 1 is Monday and 7 is Sunday)
 * If empty, all weekdays are allowed
 * @returns A rule that returns slots that fall on forbidden weekdays
 */
export const allowWeekdaysRule = (allowedWeekdays: number[] = []): SlotRule => 
  createWeekdayRule(allowedWeekdays, true);

/**
 * Creates a rule that forbids specified weekdays
 * @param forbiddenWeekdays - Array of weekday numbers to forbid (1-7, where 1 is Monday and 7 is Sunday)
 * If empty, no weekdays are forbidden
 * @returns A rule that returns slots that fall on forbidden weekdays
 */
export const forbidWeekdaysRule = (forbiddenWeekdays: number[] = []): SlotRule =>
  createWeekdayRule(forbiddenWeekdays, false); 