import { Slot, MetadataMerger, defaultMetadataMerger, OverlapStrategy } from '../types';

/**
 * Checks if two slots overlap based on the specified strategy
 */
export function doSlotsOverlap(a: Slot, b: Slot, strategy: OverlapStrategy = 'strict'): boolean {
  if (strategy === 'strict') {
    return (a.start < b.end && a.end > b.start);
  } else {
    // inclusive: slots touching at boundaries are considered overlapping
    return (a.start <= b.end && a.end >= b.start);
  }
}

/**
 * Merges two slots and their metadata
 */
export function mergeSlots(a: Slot, b: Slot, metadataMerger: MetadataMerger = defaultMetadataMerger): Slot {
  return {
    start: new Date(Math.min(a.start.getTime(), b.start.getTime())),
    end: new Date(Math.max(a.end.getTime(), b.end.getTime())),
    metadata: metadataMerger(a.metadata, b.metadata)
  };
}

/**
 * Merges an array of slots, combining any that overlap based on the specified strategy
 */
export function mergeOverlappingSlots(
  slots: Slot[], 
  metadataMerger: MetadataMerger = defaultMetadataMerger,
  overlapStrategy: OverlapStrategy = 'strict'
): Slot[] {
  if (slots.length <= 1) return slots;

  // Sort slots by start time
  const sortedSlots = [...slots].sort((a, b) => a.start.getTime() - b.start.getTime());
  const result: Slot[] = [];
  
  let i = 0;
  while (i < sortedSlots.length) {
    let current = sortedSlots[i];
    let j = i + 1;
    
    // Find next overlapping slot
    while (j < sortedSlots.length && doSlotsOverlap(current, sortedSlots[j], overlapStrategy)) {
      current = mergeSlots(current, sortedSlots[j], metadataMerger);
      j++;
    }
    
    result.push(current);
    i = j;
  }
  
  return result;
}

/**
 * Generates an array of slots between start and end date with given duration and overlap interval
 * @param startDate The start date for the first slot
 * @param endDate The end date for the last slot
 * @param duration Duration of each slot in milliseconds
 * @param overlapInterval Interval between start of consecutive slots in milliseconds
 * @param metadata Optional metadata to apply to all generated slots
 * @returns Array of generated slots
 */
export function generateSlots(
  startDate: Date,
  endDate: Date,
  duration: number,
  overlapInterval: number,
  metadata: Record<string, any> = {}
): Slot[] {
  if (startDate >= endDate) {
    return [];
  }

  if (duration <= 0 || overlapInterval <= 0) {
    throw new Error('Duration and overlap interval must be positive numbers');
  }

  const slots: Slot[] = [];
  let currentStart = startDate;

  while (currentStart.getTime() + duration <= endDate.getTime()) {
    slots.push({
      start: new Date(currentStart),
      end: new Date(currentStart.getTime() + duration),
      metadata: { ...metadata }
    });
    currentStart = new Date(currentStart.getTime() + overlapInterval);
  }

  return slots;
} 