import { DateTime } from 'luxon';
import { Slot } from '../../src/types';

const baseDate = DateTime.fromISO('2024-01-01T00:00:00.000Z', {zone: 'UTC'});

/**
 * Creates a slot from ISO datetime strings
 */
export function createSlotFromISO(start: string, end: string, metadata = {}): Slot {
  return {
    start: DateTime.fromISO(start, {zone: 'UTC'}),
    end: DateTime.fromISO(end, {zone: 'UTC'}),
    metadata
  };
}

/**
 * Creates a slot with hour offsets from a base date
 */
export function createSlotFromHourOffset(startHours: number, endHours: number, metadata = {}): Slot {
  return {
    start: baseDate.plus({ hours: startHours }),
    end: baseDate.plus({ hours: endHours }),
    metadata
  };
}

/**
 * Creates a slot with a specific timezone
 */
export function createSlotWithZone(isoDate: string, zone: string, metadata = {}): Slot {
  const dt = DateTime.fromISO(isoDate, { zone });
  return {
    start: dt,
    end: dt.plus({ hours: 1 }),
    metadata
  };
} 