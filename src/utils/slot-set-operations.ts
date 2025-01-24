import { Slot, SlotOperationResult, MetadataMerger, defaultMetadataMerger, SlotSetOperation } from '../types';

/**
 * Checks if two slots overlap
 */
function doSlotsOverlap(a: Slot, b: Slot): boolean {
  return a.start < b.end && a.end > b.start;
}

/**
 * Creates a new slot with the given time range and merged metadata
 */
function createSlot(
  start: Date,
  end: Date,
  metadata: any,
  metadataMerger: MetadataMerger = defaultMetadataMerger
): Slot {
  return { start, end, metadata };
}

/**
 * Returns the intersection of two slots (the overlapping portion)
 */
export function intersectSlots(
  a: Slot,
  b: Slot,
  metadataMerger: MetadataMerger = defaultMetadataMerger
): SlotOperationResult {
  if (!doSlotsOverlap(a, b)) {
    return { type: 'empty' };
  }

  return {
    type: 'single',
    slot: createSlot(
      new Date(Math.max(a.start.getTime(), b.start.getTime())),
      new Date(Math.min(a.end.getTime(), b.end.getTime())),
      metadataMerger(a.metadata, b.metadata)
    )
  };
}

/**
 * Returns the union of two slots (the outer bounds)
 */
export function unionSlots(
  a: Slot,
  b: Slot,
  metadataMerger: MetadataMerger = defaultMetadataMerger
): SlotOperationResult {
  // If slots are adjacent or overlapping, merge them
  if (a.end >= b.start && a.start <= b.end) {
    return {
      type: 'single',
      slot: createSlot(
        new Date(Math.min(a.start.getTime(), b.start.getTime())),
        new Date(Math.max(a.end.getTime(), b.end.getTime())),
        metadataMerger(a.metadata, b.metadata)
      )
    };
  }

  // Otherwise return both slots, sorted by start time
  return {
    type: 'multiple',
    slots: [a, b].sort((x, y) => x.start.getTime() - y.start.getTime())
  };
}

/**
 * Returns the difference between two slots (parts of a that don't overlap with b)
 */
export function differenceSlots(
  a: Slot,
  b: Slot,
  metadataMerger: MetadataMerger = defaultMetadataMerger
): SlotOperationResult {
  if (!doSlotsOverlap(a, b)) {
    return { type: 'single', slot: a };
  }

  const slots: Slot[] = [];

  // Left part
  if (a.start < b.start) {
    slots.push(createSlot(a.start, b.start, a.metadata));
  }

  // Right part
  if (a.end > b.end) {
    slots.push(createSlot(b.end, a.end, a.metadata));
  }

  return slots.length === 0 
    ? { type: 'empty' }
    : slots.length === 1 
    ? { type: 'single', slot: slots[0] }
    : { type: 'multiple', slots };
}

/**
 * Returns the symmetric difference between two slots (parts that belong to only one slot)
 */
export function symmetricDifferenceSlots(
  a: Slot,
  b: Slot,
  metadataMerger: MetadataMerger = defaultMetadataMerger
): SlotOperationResult {
  if (!doSlotsOverlap(a, b)) {
    return { type: 'multiple', slots: [a, b] };
  }

  const slots: Slot[] = [];

  // Left part (from a)
  if (a.start < b.start) {
    slots.push(createSlot(a.start, b.start, a.metadata));
  }

  // Right part (from a)
  if (a.end > b.end) {
    slots.push(createSlot(b.end, a.end, a.metadata));
  }

  // Left part (from b)
  if (b.start < a.start) {
    slots.push(createSlot(b.start, a.start, b.metadata));
  }

  // Right part (from b)
  if (b.end > a.end) {
    slots.push(createSlot(a.end, b.end, b.metadata));
  }

  return slots.length === 0 
    ? { type: 'empty' }
    : slots.length === 1 
    ? { type: 'single', slot: slots[0] }
    : { type: 'multiple', slots: slots.sort((x, y) => x.start.getTime() - y.start.getTime()) };
}

/**
 * Applies a set operation to multiple slots
 */
export function applySetOperation(
  operation: SlotSetOperation,
  slots: Slot[],
  metadataMerger: MetadataMerger = defaultMetadataMerger
): SlotOperationResult {
  if (slots.length === 0) return { type: 'empty' };
  if (slots.length === 1) return { type: 'single', slot: slots[0] };

  // For union operation, we need to handle non-overlapping slots differently
  if (operation === 'union') {
    // Sort slots by start time
    const sortedSlots = [...slots].sort((a, b) => a.start.getTime() - b.start.getTime());
    let result = sortedSlots[0];
    let currentEnd = result.end;

    for (let i = 1; i < sortedSlots.length; i++) {
      const current = sortedSlots[i];
      // If current slot starts after previous end, we have a gap
      if (current.start > currentEnd) {
        // For union, we want to include the gap
        result = createSlot(
          result.start,
          current.end,
          metadataMerger(result.metadata, current.metadata)
        );
      } else {
        // Slots overlap or are adjacent, extend the end time if needed
        if (current.end > currentEnd) {
          result = createSlot(
            result.start,
            current.end,
            metadataMerger(result.metadata, current.metadata)
          );
        }
      }
      currentEnd = result.end;
    }
    return { type: 'single', slot: result };
  }

  // For other operations, use the original logic
  let result = slots[0];
  for (let i = 1; i < slots.length; i++) {
    const operationResult = (() => {
      switch (operation) {
        case 'intersection':
          return intersectSlots(result, slots[i], metadataMerger);
        case 'difference':
          return differenceSlots(result, slots[i], metadataMerger);
        case 'symmetric_difference':
          return symmetricDifferenceSlots(result, slots[i], metadataMerger);
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    })();

    if (operationResult.type === 'empty') return operationResult;
    result = operationResult.type === 'single' 
      ? operationResult.slot 
      : operationResult.slots[0];
  }

  return { type: 'single', slot: result };
} 