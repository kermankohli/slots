import { DateTime } from 'luxon';
import { addSlots, removeSlots, updateSlot } from '../src';
import { Slot, composeOperators } from '../src/types';
import { createSlotFromHourOffset } from './helpers/slot-test-helpers';

describe('slot operations', () => {

  describe('addSlots', () => {
    it('should add a single slot', () => {
      const slot = createSlotFromHourOffset(0, 1);
      const result = addSlots(slot)([]);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(slot);
    });

    it('should add multiple slots', () => {
      const slots = [createSlotFromHourOffset(0, 1), createSlotFromHourOffset(2, 3)];
      const result = addSlots(slots)([]);
      expect(result.data).toHaveLength(2);
      expect(result.data).toEqual(slots);
    });

    it('should merge overlapping slots', () => {
      const slots = [createSlotFromHourOffset(0, 2), createSlotFromHourOffset(1, 3)];
      const result = addSlots(slots)([]);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(createSlotFromHourOffset(0, 3));
    });

    it('should handle invalid slots', () => {
      const invalidSlot = { start: 'not a date' } as any;
      const result = addSlots(invalidSlot)([]);
      expect(result.error).toBe('Invalid slot format');
      expect(result.data).toEqual([]);
    });
  });

  describe('removeSlots', () => {
    it('should remove a single slot', () => {
      const slot = createSlotFromHourOffset(0, 1);
      const result = removeSlots(slot)([slot]);
      expect(result.data).toHaveLength(0);
    });

    it('should remove multiple slots', () => {
      const slots = [
        createSlotFromHourOffset(0, 1),
        createSlotFromHourOffset(2, 3),
        createSlotFromHourOffset(4, 5)
      ];
      const toRemove = [slots[0], slots[2]];
      const result = removeSlots(toRemove)(slots);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(slots[1]);
    });

    it('should handle non-existent slots', () => {
      const slots = [createSlotFromHourOffset(0, 1)];
      const result = removeSlots(createSlotFromHourOffset(2, 3))(slots);
      expect(result.data).toEqual(slots);
    });
  });

  describe('updateSlot', () => {
    it('should update a slot', () => {
      const oldSlot = createSlotFromHourOffset(0, 1, { old: true });
      const newSlot = createSlotFromHourOffset(0, 2, { new: true });
      const result = updateSlot(oldSlot, newSlot)([oldSlot]);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(newSlot);
    });

    it('should merge with overlapping slots during update', () => {
      const oldSlot = createSlotFromHourOffset(0, 1);
      const existingSlot = createSlotFromHourOffset(1.5, 2.5);
      const newSlot = createSlotFromHourOffset(1, 2);
      const result = updateSlot(oldSlot, newSlot)([oldSlot, existingSlot]);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(createSlotFromHourOffset(1, 2.5));
    });

    it('should handle invalid new slot', () => {
      const oldSlot = createSlotFromHourOffset(0, 1);
      const result = updateSlot(oldSlot, { start: 'invalid' } as any)([oldSlot]);
      expect(result.error).toBe('Invalid new slot format');
      expect(result.data).toEqual([oldSlot]);
    });
  });

  describe('composition', () => {
    it('should compose multiple operations', () => {
      const initialSlots = [createSlotFromHourOffset(0, 1), createSlotFromHourOffset(2, 3)];
      const composedOperation = composeOperators(
        addSlots(createSlotFromHourOffset(1, 2)),
        removeSlots(initialSlots[0])
      );

      const result = composedOperation(initialSlots);
      expect(result.data).toHaveLength(2);
      expect(result.data).toEqual([
        createSlotFromHourOffset(1, 2),
        createSlotFromHourOffset(2, 3)
      ]);
    });

    it('should stop on first error in composition', () => {
      const slots = [createSlotFromHourOffset(0, 1)];
      const composedOperation = composeOperators(
        addSlots({ start: 'invalid' } as any),
        removeSlots(slots[0])
      );

      const result = composedOperation(slots);
      expect(result.error).toBe('Invalid slot format');
      expect(result.data).toEqual(slots);
    });
  });
}); 