import { Slot } from '../types';

/**
 * Checks if two slots strictly overlap (not just touching)
 */
export function doSlotsOverlap(a: Slot, b: Slot): boolean {
  return (a.start < b.end && a.end > b.start);
}

/**
 * Merges two slots and their metadata
 */
export function mergeSlots(a: Slot, b: Slot): Slot {
  return {
    start: new Date(Math.min(a.start.getTime(), b.start.getTime())),
    end: new Date(Math.max(a.end.getTime(), b.end.getTime())),
    metadata: { ...a.metadata, ...b.metadata }
  };
}

/**
 * Merges an array of slots, combining any that overlap
 */
export function mergeOverlappingSlots(slots: Slot[]): Slot[] {
  if (slots.length <= 1) return slots;

  // Sort slots by start time
  const sortedSlots = [...slots].sort((a, b) => a.start.getTime() - b.start.getTime());
  const result: Slot[] = [];
  
  let current = sortedSlots[0];
  
  for (let i = 1; i < sortedSlots.length; i++) {
    const next = sortedSlots[i];
    if (doSlotsOverlap(current, next)) {
      current = mergeSlots(current, next);
    } else {
      result.push(current);
      current = next;
    }
  }
  
  result.push(current);
  return result;
} 