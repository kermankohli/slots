import { DateTime } from 'luxon';
import { Slot } from '../types';
import { SlotRule } from '../types';

interface TimeOfDay {
  hour: number;
  minute?: number;
}

/**
 * Creates a rule that blocks slots that fall within specified hours of the day
 * @param start - Start time of day (e.g., { hour: 9, minute: 30 } for 9:30 AM)
 * @param end - End time of day (e.g., { hour: 17 } for 5:00 PM)
 * @returns A rule that returns slots that fall within the specified time range
 */
export const createTimeOfDayRule = (start: TimeOfDay, end: TimeOfDay): SlotRule => (slots) => {
  // Normalize minutes if not provided
  const startMinute = start.minute || 0;
  const endMinute = end.minute || 0;

  return slots.filter(slot => {
    // Get hour and minute of the slot's start and end times
    const slotStartHour = slot.start.hour;
    const slotStartMinute = slot.start.minute;
    const slotEndHour = slot.end.hour;
    const slotEndMinute = slot.end.minute;

    // Convert times to comparable numbers (e.g., 9:30 -> 9.5)
    const startTime = start.hour + startMinute / 60;
    const endTime = end.hour + endMinute / 60;
    const slotStartTime = slotStartHour + slotStartMinute / 60;
    const slotEndTime = slotEndHour + slotEndMinute / 60;

    // Handle case where slot spans midnight
    if (slotEndTime < slotStartTime) {
      // For slots spanning midnight, check if any part of the slot is in the forbidden range
      return (
        (startTime <= slotStartTime && slotStartTime <= 24) || // Check if start is in range before midnight
        (0 <= slotEndTime && slotEndTime <= endTime) || // Check if end is in range after midnight
        (slotStartTime <= startTime && slotEndTime >= endTime) // Check if slot encompasses the entire range
      );
    }

    // Normal case (slot doesn't span midnight)
    return (
      (slotStartTime >= startTime && slotStartTime < endTime) || // Starts during range
      (slotEndTime > startTime && slotEndTime <= endTime) || // Ends during range
      (slotStartTime <= startTime && slotEndTime >= endTime) // Encompasses range
    );
  });
};

/**
 * Creates a rule that allows slots within the specified hours of the day
 * @param start - Start time of day (e.g., { hour: 9, minute: 30 } for 9:30 AM)
 * @param end - End time of day (e.g., { hour: 17 } for 5:00 PM)
 * @returns A rule that returns slots that fall outside the specified time range
 */
export const allowTimeOfDayRule = (start: TimeOfDay, end: TimeOfDay): SlotRule => (slots) => {
  const blockedSlots = createTimeOfDayRule({ hour: 0 }, start)(slots)
    .concat(createTimeOfDayRule(end, { hour: 24 })(slots));
  return slots.filter(slot => !blockedSlots.some(blocked => 
    blocked.start.equals(slot.start) && blocked.end.equals(slot.end)
  ));
};

// Convenience functions for common use cases
export const noMeetingsBeforeRule = (hour: number, minute: number = 0): SlotRule =>
  createTimeOfDayRule({ hour: 0 }, { hour, minute });

export const noMeetingsAfterRule = (hour: number, minute: number = 0): SlotRule =>
  createTimeOfDayRule({ hour, minute }, { hour: 24 });

export const blockTimeRangeRule = (
  startHour: number,
  endHour: number,
  startMinute: number = 0,
  endMinute: number = 0
): SlotRule =>
  createTimeOfDayRule(
    { hour: startHour, minute: startMinute },
    { hour: endHour, minute: endMinute }
  );

export const allowTimeRangeRule = (
  startHour: number,
  endHour: number,
  startMinute: number = 0,
  endMinute: number = 0
): SlotRule =>
  allowTimeOfDayRule(
    { hour: startHour, minute: startMinute },
    { hour: endHour, minute: endMinute }
  ); 