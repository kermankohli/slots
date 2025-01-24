import { Slot, SlotOperationResult, SlotOperationOptions, MetadataMerger, EdgeStrategy } from '../types';

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

  const start = new Date(Math.max(slotA.start.getTime(), slotB.start.getTime()));
  const end = new Date(Math.min(slotA.end.getTime(), slotB.end.getTime()));
  
  // For exclusive edges, if start equals end, there's no real overlap
  if (edgeStrategy === 'exclusive' && start.getTime() === end.getTime()) {
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
    ? slotA.end.getTime() >= slotB.start.getTime() && slotA.start.getTime() <= slotB.end.getTime()
    : slotA.end.getTime() > slotB.start.getTime() && slotA.start.getTime() < slotB.end.getTime();

  if (!shouldMerge) {
    return [slotA, slotB].sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  const start = new Date(Math.min(slotA.start.getTime(), slotB.start.getTime()));
  const end = new Date(Math.max(slotA.end.getTime(), slotB.end.getTime()));
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
    if (slotA.start.getTime() < slotB.start.getTime() || slotA.end.getTime() > slotB.end.getTime()) {
      results.push({
        start: slotA.start,
        end: slotB.start,
        metadata: slotA.metadata
      });
    }

    // Preserve touching points
    if (slotA.end.getTime() === slotB.start.getTime()) {
      results.push({
        start: slotA.end,
        end: slotA.end,
        metadata: slotA.metadata
      });
    }

    return results.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  // For inclusive mode, use original logic
  if (!doSlotsOverlap(slotA, slotB, edgeStrategy)) {
    return [slotA];
  }

  const results: Slot[] = [];

  // Left part
  if (slotA.start.getTime() < slotB.start.getTime()) {
    results.push({
      start: slotA.start,
      end: slotB.start,
      metadata: slotA.metadata
    });
  }

  // Right part
  if (slotA.end.getTime() > slotB.end.getTime()) {
    results.push({
      start: slotB.end,
      end: slotA.end,
      metadata: slotA.metadata
    });
  }

  return results.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Returns the symmetric difference between two slots (parts that belong to only one slot)
 */
export function symmetricDifferenceSlots(slotA: Slot, slotB: Slot, options: SlotOperationOptions): SlotOperationResult {
  const aMinusB = differenceSlots(slotA, slotB, options);
  const bMinusA = differenceSlots(slotB, slotA, options);

  return [...aMinusB, ...bMinusA].sort((a, b) => a.start.getTime() - b.start.getTime());
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