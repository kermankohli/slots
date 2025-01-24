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