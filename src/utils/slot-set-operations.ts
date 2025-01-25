import { DateTime } from 'luxon';
import { Slot, SlotOperationOptions, EdgeStrategy, SlotOperationResult } from '../types';

/**
 * Checks if two slots overlap based on edge strategy
 */
function doSlotsOverlap(a: Slot, b: Slot, edgeStrategy: EdgeStrategy = 'inclusive'): boolean {
  if (edgeStrategy === 'inclusive') {
    return a.start <= b.end && b.start <= a.end;
  } else {
    return a.start < b.end && b.start < a.end;
  }
}

/**
 * Returns the intersection of two slots (the overlapping portion)
 */
export function intersectSlots(slotA: Slot, slotB: Slot, options: SlotOperationOptions): SlotOperationResult {
  const { metadataMerger, edgeStrategy = 'inclusive' } = options;

  if (!doSlotsOverlap(slotA, slotB, edgeStrategy)) {
    return [];
  }

  const start = DateTime.max(slotA.start, slotB.start);
  const end = DateTime.min(slotA.end, slotB.end);
  
  // For exclusive edges, if start equals end, there's no real overlap
  if (edgeStrategy === 'exclusive' && start.equals(end)) {
    return [];
  }

  const metadata = metadataMerger(slotA.metadata, slotB.metadata);
  return [{ start, end, metadata }];
}

/**
 * Returns the union of two slots (the outer bounds)
 */
export function unionSlots(slotA: Slot, slotB: Slot, options: SlotOperationOptions): SlotOperationResult {
  const { metadataMerger, edgeStrategy = 'inclusive' } = options;

  // For exclusive edges, we need a gap to consider them separate
  const shouldMerge = edgeStrategy === 'inclusive' 
    ? slotA.end >= slotB.start && slotA.start <= slotB.end
    : slotA.end > slotB.start && slotA.start < slotB.end;

  if (!shouldMerge) {
    return [slotA, slotB].sort((a, b) => a.start.toMillis() - b.start.toMillis());
  }

  const start = DateTime.min(slotA.start, slotB.start);
  const end = DateTime.max(slotA.end, slotB.end);
  const metadata = metadataMerger(slotA.metadata, slotB.metadata);

  return [{ start, end, metadata }];
}

/**
 * Returns the difference between two slots (parts of a that don't overlap with b)
 */
export function differenceSlots(slotA: Slot, slotB: Slot, options: SlotOperationOptions): SlotOperationResult {
  const { metadataMerger, edgeStrategy = 'inclusive' } = options;

  // For exclusive mode, handle touching points even if slots don't overlap
  if (edgeStrategy === 'exclusive') {
    const results: Slot[] = [];
    
    // Add the main slot if it exists
    if (slotA.start < slotB.start || slotA.end > slotB.end) {
      results.push({
        start: slotA.start,
        end: slotB.start,
        metadata: slotA.metadata
      });
    }

    // Preserve touching points
    if (slotA.end.equals(slotB.start)) {
      results.push({
        start: slotA.end,
        end: slotA.end,
        metadata: slotA.metadata
      });
    }

    return results.sort((a, b) => a.start.toMillis() - b.start.toMillis());
  }

  // For inclusive mode, use original logic
  if (!doSlotsOverlap(slotA, slotB, edgeStrategy)) {
    return [slotA];
  }

  const results: Slot[] = [];

  // Left part
  if (slotA.start < slotB.start) {
    results.push({
      start: slotA.start,
      end: slotB.start,
      metadata: slotA.metadata
    });
  }

  // Right part
  if (slotA.end > slotB.end) {
    results.push({
      start: slotB.end,
      end: slotA.end,
      metadata: slotA.metadata
    });
  }

  return results.sort((a, b) => a.start.toMillis() - b.start.toMillis());
}

/**
 * Returns the symmetric difference between two slots (parts that belong to only one slot)
 */
export function symmetricDifferenceSlots(slotA: Slot, slotB: Slot, options: SlotOperationOptions): SlotOperationResult {
  const aMinusB = differenceSlots(slotA, slotB, options);
  const bMinusA = differenceSlots(slotB, slotA, options);

  return [...aMinusB, ...bMinusA].sort((a, b) => a.start.toMillis() - b.start.toMillis());
}

/**
 * Applies a set operation to two slots
 */
export function applySetOperation(
  operation: 'union' | 'intersection' | 'difference' | 'symmetric_difference',
  slotA: Slot,
  slotB: Slot,
  options: SlotOperationOptions
): SlotOperationResult {
  switch (operation) {
    case 'union':
      return unionSlots(slotA, slotB, options);
    case 'intersection':
      return intersectSlots(slotA, slotB, options);
    case 'difference':
      return differenceSlots(slotA, slotB, options);
    case 'symmetric_difference':
      return symmetricDifferenceSlots(slotA, slotB, options);
  }
} 