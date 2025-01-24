import { doSlotsOverlap, mergeSlots, mergeOverlappingSlots } from '../src/utils/slot-helpers';
import { Slot } from '../src/types';

describe('slot helpers', () => {
  const baseDate = new Date('2024-01-01T10:00:00Z');
  
  const createSlot = (startHours: number, endHours: number, metadata: Record<string, any> = {}): Slot => ({
    start: new Date(baseDate.getTime() + startHours * 3600000),
    end: new Date(baseDate.getTime() + endHours * 3600000),
    metadata
  });

  describe('doSlotsOverlap', () => {
    it('should detect overlapping slots', () => {
      expect(doSlotsOverlap(createSlot(1, 3), createSlot(2, 4))).toBe(true);
      expect(doSlotsOverlap(createSlot(1, 4), createSlot(2, 3))).toBe(true);
      expect(doSlotsOverlap(createSlot(1, 2), createSlot(2, 3))).toBe(false); // Adjacent slots
    });

    it('should detect non-overlapping slots', () => {
      expect(doSlotsOverlap(createSlot(1, 2), createSlot(3, 4))).toBe(false);
      expect(doSlotsOverlap(createSlot(3, 4), createSlot(1, 2))).toBe(false);
    });
  });

  describe('mergeSlots', () => {
    it('should merge overlapping slots', () => {
      const result = mergeSlots(
        createSlot(1, 3, { a: 1 }),
        createSlot(2, 4, { b: 2 })
      );
      expect(result.start).toEqual(createSlot(1, 4).start);
      expect(result.end).toEqual(createSlot(1, 4).end);
      expect(result.metadata).toEqual({ a: 1, b: 2 });
    });

    it('should merge adjacent slots', () => {
      const result = mergeSlots(
        createSlot(1, 2, { a: 1 }),
        createSlot(2, 3, { b: 2 })
      );
      expect(result.start).toEqual(createSlot(1, 3).start);
      expect(result.end).toEqual(createSlot(1, 3).end);
      expect(result.metadata).toEqual({ a: 1, b: 2 });
    });

    it('should handle metadata overwrites', () => {
      const result = mergeSlots(
        createSlot(1, 3, { key: 'old' }),
        createSlot(2, 4, { key: 'new' })
      );
      expect(result.metadata).toEqual({ key: 'new' });
    });
  });

  describe('mergeOverlappingSlots', () => {
    it('should handle empty array', () => {
      expect(mergeOverlappingSlots([])).toEqual([]);
    });

    it('should handle single slot', () => {
      const slot = createSlot(1, 2);
      expect(mergeOverlappingSlots([slot])).toEqual([slot]);
    });

    it('should merge multiple overlapping slots', () => {
      const slots = [
        createSlot(1, 3, { a: 1 }),
        createSlot(2, 4, { b: 2 }),
        createSlot(3.5, 5, { c: 3 })
      ];
      const result = mergeOverlappingSlots(slots);
      expect(result).toHaveLength(1);
    });

    it('should handle multiple overlapping slots in random order', () => {
      const slots = [
        createSlot(3, 4),
        createSlot(1, 2),
        createSlot(1.5, 3.5)
      ];
      const result = mergeOverlappingSlots(slots);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(createSlot(1, 4));
    });
  });
}); 