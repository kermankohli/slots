import { Slot, SlotOperator, OperationResult } from '../types';
import { isSlot } from '../utils/validation';
import { mergeOverlappingSlots } from '../utils/slot-helpers';

/**
 * Creates an operator that adds slots to the collection
 */
export const addSlots = (newSlots: Slot | Slot[]): SlotOperator<Slot[]> => {
  return (currentSlots: Slot[]): OperationResult<Slot[]> => {
    const slotsToAdd = Array.isArray(newSlots) ? newSlots : [newSlots];

    // Validate all new slots
    for (const slot of slotsToAdd) {
      if (!isSlot(slot)) {
        return { data: currentSlots, error: 'Invalid slot format' };
      }
    }

    // Merge all slots (existing and new)
    return {
      data: mergeOverlappingSlots([...currentSlots, ...slotsToAdd])
    };
  };
};

/**
 * Creates an operator that removes slots that match exactly (same start and end times)
 * For removing overlapping slots, use removeOverlappingSlots from slot-set-operations
 */
export const removeExactSlots = (slotsToRemove: Slot | Slot[]): SlotOperator<Slot[]> => {
  return (currentSlots: Slot[]): OperationResult<Slot[]> => {
    const toRemove = Array.isArray(slotsToRemove) ? slotsToRemove : [slotsToRemove];
    return {
      data: currentSlots.filter(currentSlot => 
        !toRemove.some(removeSlot => 
          removeSlot.start.equals(currentSlot.start) &&
          removeSlot.end.equals(currentSlot.end)
        )
      )
    };
  };
};

// Deprecated - use removeExactSlots instead
export const removeSlots = removeExactSlots;

/**
 * Creates an operator that updates a slot in the collection
 */
export const updateSlot = (oldSlot: Slot, newSlot: Slot): SlotOperator<Slot[]> => {
  return (slots: Slot[]): OperationResult<Slot[]> => {
    if (!isSlot(newSlot)) {
      return { data: slots, error: 'Invalid new slot format' };
    }

    // First remove the old slot
    const withoutOld = removeSlots(oldSlot)(slots);
    if (withoutOld.error) return withoutOld;

    // Then add the new slot, which will handle merging with any overlapping slots
    return addSlots(newSlot)(withoutOld.data);
  };
}; 