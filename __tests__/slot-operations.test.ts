import { DateTime } from 'luxon';
import { addSlots, removeSlots, updateSlot } from '../src';
import { Slot, composeOperators } from '../src/types';

describe('slot operations', () => {
  const baseDate = DateTime.fromISO('2024-01-01T10:00:00.000Z');
  
  const createSlot = (startHours: number, endHours: number, metadata: Record<string, any> = {}): Slot => ({
    start: baseDate.plus({ hours: startHours }),
    end: baseDate.plus({ hours: endHours }),
    metadata
  });

  describe('addSlots', () => {
    it('should add a single slot', () => {
      const slot = createSlot(0, 1);
      const result = addSlots(slot)([]);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(slot);
    });

    it('should add multiple slots', () => {
      const slots = [createSlot(0, 1), createSlot(2, 3)];
      const result = addSlots(slots)([]);
      expect(result.data).toHaveLength(2);
      expect(result.data).toEqual(slots);
    });

    it('should merge overlapping slots', () => {
      const slots = [createSlot(0, 2), createSlot(1, 3)];
      const result = addSlots(slots)([]);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(createSlot(0, 3));
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
      const slot = createSlot(0, 1);
      const result = removeSlots(slot)([slot]);
      expect(result.data).toHaveLength(0);
    });

    it('should remove multiple slots', () => {
      const slots = [createSlot(0, 1), createSlot(2, 3), createSlot(4, 5)];
      const toRemove = [slots[0], slots[2]];
      const result = removeSlots(toRemove)(slots);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(slots[1]);
    });

    it('should handle non-existent slots', () => {
      const slots = [createSlot(0, 1)];
      const result = removeSlots(createSlot(2, 3))(slots);
      expect(result.data).toEqual(slots);
    });
  });

  describe('updateSlot', () => {
    it('should update a slot', () => {
      const oldSlot = createSlot(0, 1, { old: true });
      const newSlot = createSlot(0, 2, { new: true });
      const result = updateSlot(oldSlot, newSlot)([oldSlot]);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(newSlot);
    });

    it('should merge with overlapping slots during update', () => {
      const oldSlot = createSlot(0, 1);
      const existingSlot = createSlot(1.5, 2.5);
      const newSlot = createSlot(1, 2);
      const result = updateSlot(oldSlot, newSlot)([oldSlot, existingSlot]);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(createSlot(1, 2.5));
    });

    it('should handle invalid new slot', () => {
      const oldSlot = createSlot(0, 1);
      const result = updateSlot(oldSlot, { start: 'invalid' } as any)([oldSlot]);
      expect(result.error).toBe('Invalid new slot format');
      expect(result.data).toEqual([oldSlot]);
    });
  });

  describe('composition', () => {
    it('should compose multiple operations', () => {
      const initialSlots = [createSlot(0, 1), createSlot(2, 3)];
      const composedOperation = composeOperators(
        addSlots(createSlot(1, 2)),
        removeSlots(initialSlots[0])
      );

      const result = composedOperation(initialSlots);
      expect(result.data).toHaveLength(2);
      expect(result.data).toEqual([
        createSlot(1, 2),
        createSlot(2, 3)
      ]);
    });

    it('should stop on first error in composition', () => {
      const slots = [createSlot(0, 1)];
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