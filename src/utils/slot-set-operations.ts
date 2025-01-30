import { DateTime } from 'luxon';
import { Slot, SlotOperationOptions, EdgeStrategy, SlotOperationResult } from '../types';
import { mergeOverlappingSlots } from './slot-helpers';

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

type SlotInput = Slot | Slot[];

/**
 * Ensures input is an array of slots and merges any overlapping slots
 */
function normalizeInput(input: SlotInput): Slot[] {
  const slots = Array.isArray(input) ? input : [input];
  return mergeOverlappingSlots(slots);
}

/**
 * Returns the intersection of slots
 * Works with both single slots and arrays of slots
 */
export function intersectSlots(
  a: SlotInput,
  b: SlotInput,
  options: SlotOperationOptions
): SlotOperationResult {
  const slotsA = normalizeInput(a);
  const slotsB = normalizeInput(b);
  
  const result: Slot[] = [];
  
  for (const slotA of slotsA) {
    for (const slotB of slotsB) {
      if (!doSlotsOverlap(slotA, slotB, options.edgeStrategy)) continue;

      const start = DateTime.max(slotA.start, slotB.start);
      const end = DateTime.min(slotA.end, slotB.end);
      
      // For exclusive edges, if start equals end, there's no real overlap
      if (options.edgeStrategy === 'exclusive' && start.equals(end)) continue;

      // Check if intersection meets minimum duration
      if (options.minDuration && end.diff(start).as('milliseconds') < options.minDuration.as('milliseconds')) continue;

      result.push({
        start,
        end,
        metadata: options.metadataMerger(slotA.metadata, slotB.metadata)
      });
    }
  }
  
  return mergeOverlappingSlots(result);
}

/**
 * Returns the union of slots
 * Works with both single slots and arrays of slots
 */
export function unionSlots(
  a: SlotInput,
  b: SlotInput,
  options: SlotOperationOptions
): SlotOperationResult {
  const slots = [...normalizeInput(a), ...normalizeInput(b)];
  return mergeOverlappingSlots(slots);
}

/**
 * Returns slots from A with any overlapping portions from B removed
 * Will split slots that partially overlap and keep non-overlapping portions
 */
export const removeOverlappingSlots = (
  slots: SlotInput,
  slotsToRemove: SlotInput,
  options: SlotOperationOptions
): SlotOperationResult => {
  const slotsA = normalizeInput(slots);
  const slotsB = normalizeInput(slotsToRemove);
  
  let result = [...slotsA];
  
  for (const slotB of slotsB) {
    const newResult: Slot[] = [];
    for (const slotA of result) {
      if (!doSlotsOverlap(slotA, slotB, options.edgeStrategy)) {
        newResult.push(slotA);
        continue;
      }

      // Add left part if it exists and meets minimum duration
      if (slotA.start < slotB.start) {
        const leftPart = {
          start: slotA.start,
          end: slotB.start,
          metadata: slotA.metadata
        };
        if (!options.minDuration || leftPart.end.diff(leftPart.start).as('milliseconds') >= options.minDuration.as('milliseconds')) {
          newResult.push(leftPart);
        }
      }

      // Add right part if it exists and meets minimum duration
      if (slotA.end > slotB.end) {
        const rightPart = {
          start: slotB.end,
          end: slotA.end,
          metadata: slotA.metadata
        };
        if (!options.minDuration || rightPart.end.diff(rightPart.start).as('milliseconds') >= options.minDuration.as('milliseconds')) {
          newResult.push(rightPart);
        }
      }
    }
    result = newResult;
  }
  
  // Return result without merging overlapping slots
  return result;
};

/**
 * Returns the symmetric difference between slots (parts that belong to only one input)
 * Works with both single slots and arrays of slots
 */
export function symmetricDifferenceSlots(
  a: SlotInput,
  b: SlotInput,
  options: SlotOperationOptions
): SlotOperationResult {
  const aMinusB = removeOverlappingSlots(a, b, options);
  const bMinusA = removeOverlappingSlots(b, a, options);
  
  return mergeOverlappingSlots([...aMinusB, ...bMinusA]);
}

/**
 * Applies a set operation to slots
 * Works with both single slots and arrays of slots
 */
export function applySetOperation(
  operation: 'union' | 'intersection' | 'difference' | 'symmetric_difference',
  a: SlotInput,
  b: SlotInput,
  options: SlotOperationOptions
): SlotOperationResult {
  switch (operation) {
    case 'union':
      return unionSlots(a, b, options);
    case 'intersection':
      return intersectSlots(a, b, options);
    case 'difference':
      return removeOverlappingSlots(a, b, options);
    case 'symmetric_difference':
      return symmetricDifferenceSlots(a, b, options);
  }
} 