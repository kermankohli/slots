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
 * Creates an operator that removes slots from the collection
 */
export const removeSlots = (slotsToRemove: Slot | Slot[]): SlotOperator<Slot[]> => {
  return (currentSlots: Slot[]): OperationResult<Slot[]> => {
    const toRemove = Array.isArray(slotsToRemove) ? slotsToRemove : [slotsToRemove];
    return {
      data: currentSlots.filter(currentSlot => 
        !toRemove.some(removeSlot => 
          removeSlot.start.getTime() === currentSlot.start.getTime() &&
          removeSlot.end.getTime() === currentSlot.end.getTime()
        )
      )
    };
  };
};

/**
 * Creates an operator that updates a slot in the collection
 */
export const updateSlot = (oldSlot: Slot, newSlot: Slot): SlotOperator<Slot[]> => {
  return (currentSlots: Slot[]): OperationResult<Slot[]> => {
    if (!isSlot(newSlot)) {
      return { data: currentSlots, error: 'Invalid new slot format' };
    }

    const slotsWithoutOld = currentSlots.filter(slot => 
      slot.start.getTime() !== oldSlot.start.getTime() ||
      slot.end.getTime() !== oldSlot.end.getTime()
    );

    return {
      data: mergeOverlappingSlots([...slotsWithoutOld, newSlot])
    };
  };
}; 