import { DateTime, Duration, Interval } from 'luxon';
import { Slot, MetadataMerger, defaultMetadataMerger, OverlapStrategy } from '../types';

/**
 * Checks if two slots overlap based on the specified strategy
 */
export function doSlotsOverlap(a: Slot, b: Slot, strategy: OverlapStrategy = 'strict'): boolean {
  const interval1 = Interval.fromDateTimes(a.start, a.end);
  const interval2 = Interval.fromDateTimes(b.start, b.end);
  
  if (strategy === 'strict') {
    return interval1.overlaps(interval2);
  } else {
    // inclusive: slots touching at boundaries are considered overlapping
    return interval1.abutsStart(interval2) || 
           interval1.abutsEnd(interval2) || 
           interval1.overlaps(interval2);
  }
}

/**
 * Merges two slots and their metadata
 */
export function mergeSlots(a: Slot, b: Slot, metadataMerger: MetadataMerger = defaultMetadataMerger): Slot {
  return {
    start: DateTime.min(a.start, b.start),
    end: DateTime.max(a.end, b.end),
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
  const sortedSlots = [...slots].sort((a, b) => a.start.toMillis() - b.start.toMillis());
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
  start: DateTime,
  end: DateTime,
  duration: Duration,
  overlapInterval: Duration,
  metadata: Record<string, any> = {}
): Slot[] {
  if (start >= end) {
    return [];
  }

  if (!duration.isValid || !overlapInterval.isValid || duration.toMillis() <= 0 || overlapInterval.toMillis() <= 0) {
    throw new Error('Duration and overlap interval must be positive and valid');
  }

  const slots: Slot[] = [];
  let currentStart = start;

  while (currentStart.plus(duration) <= end) {
    slots.push({
      start: currentStart,
      end: currentStart.plus(duration),
      metadata: { ...metadata }
    });
    currentStart = currentStart.plus(overlapInterval);
  }

  return slots;
} 