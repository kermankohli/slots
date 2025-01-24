import { 
  intersectSlots, 
  unionSlots, 
  differenceSlots, 
  symmetricDifferenceSlots,
  applySetOperation 
} from '../src/utils/slot-set-operations';
import { Slot, MetadataMerger } from '../src/types';

describe('slot set operations', () => {
  const baseDate = new Date('2024-01-01T10:00:00Z');
  
  const createSlot = (startHours: number, endHours: number, metadata: Record<string, any> = {}): Slot => ({
    start: new Date(baseDate.getTime() + startHours * 3600000),
    end: new Date(baseDate.getTime() + endHours * 3600000),
    metadata
  });

  describe('intersectSlots', () => {
    it('should return empty for non-overlapping slots', () => {
      const result = intersectSlots(createSlot(1, 2), createSlot(3, 4));
      expect(result.type).toBe('empty');
    });

    it('should return overlapping portion', () => {
      const result = intersectSlots(createSlot(1, 3), createSlot(2, 4));
      expect(result.type).toBe('single');
      if (result.type === 'single') {
        expect(result.slot.start).toEqual(createSlot(2, 3).start);
        expect(result.slot.end).toEqual(createSlot(2, 3).end);
      }
    });

    it('should merge metadata', () => {
      const customMerger: MetadataMerger = (m1, m2) => ({ 
        values: [...(m1.values || []), ...(m2.values || [])] 
      });

      const result = intersectSlots(
        createSlot(1, 3, { values: [1] }),
        createSlot(2, 4, { values: [2] }),
        customMerger
      );
      expect(result.type).toBe('single');
      if (result.type === 'single') {
        expect(result.slot.metadata).toEqual({ values: [1, 2] });
      }
    });
  });

  describe('unionSlots', () => {
    it('should return both slots for non-overlapping slots', () => {
      const result = unionSlots(createSlot(1, 2), createSlot(3, 4));
      expect(result.type).toBe('multiple');
      if (result.type === 'multiple') {
        expect(result.slots).toHaveLength(2);
      }
    });

    it('should return outer bounds for overlapping slots', () => {
      const result = unionSlots(createSlot(1, 3), createSlot(2, 4));
      expect(result.type).toBe('single');
      if (result.type === 'single') {
        expect(result.slot.start).toEqual(createSlot(1, 4).start);
        expect(result.slot.end).toEqual(createSlot(1, 4).end);
      }
    });
  });

  describe('differenceSlots', () => {
    it('should return original slot if no overlap', () => {
      const slot = createSlot(1, 2);
      const result = differenceSlots(slot, createSlot(3, 4));
      expect(result.type).toBe('single');
      if (result.type === 'single') {
        expect(result.slot).toEqual(slot);
      }
    });

    it('should return remaining parts', () => {
      const result = differenceSlots(createSlot(1, 4), createSlot(2, 3));
      expect(result.type).toBe('multiple');
      if (result.type === 'multiple') {
        expect(result.slots).toHaveLength(2);
        expect(result.slots[0].start).toEqual(createSlot(1, 2).start);
        expect(result.slots[0].end).toEqual(createSlot(1, 2).end);
        expect(result.slots[1].start).toEqual(createSlot(3, 4).start);
        expect(result.slots[1].end).toEqual(createSlot(3, 4).end);
      }
    });
  });

  describe('symmetricDifferenceSlots', () => {
    it('should return both slots if no overlap', () => {
      const result = symmetricDifferenceSlots(createSlot(1, 2), createSlot(3, 4));
      expect(result.type).toBe('multiple');
      if (result.type === 'multiple') {
        expect(result.slots).toHaveLength(2);
      }
    });

    it('should return non-overlapping parts', () => {
      const result = symmetricDifferenceSlots(createSlot(1, 3), createSlot(2, 4));
      expect(result.type).toBe('multiple');
      if (result.type === 'multiple') {
        expect(result.slots).toHaveLength(2);
        expect(result.slots[0].start).toEqual(createSlot(1, 2).start);
        expect(result.slots[0].end).toEqual(createSlot(1, 2).end);
        expect(result.slots[1].start).toEqual(createSlot(3, 4).start);
        expect(result.slots[1].end).toEqual(createSlot(3, 4).end);
      }
    });
  });

  describe('applySetOperation', () => {
    it('should handle empty array', () => {
      const result = applySetOperation('union', []);
      expect(result.type).toBe('empty');
    });

    it('should handle single slot', () => {
      const slot = createSlot(1, 2);
      const result = applySetOperation('union', [slot]);
      expect(result.type).toBe('single');
      if (result.type === 'single') {
        expect(result.slot).toEqual(slot);
      }
    });

    it('should apply operation to multiple slots', () => {
      const slots = [
        createSlot(1, 3),
        createSlot(2, 4),
        createSlot(5, 6)
      ];

      const union = applySetOperation('union', slots);
      expect(union.type).toBe('single');
      if (union.type === 'single') {
        expect(union.slot.start).toEqual(createSlot(1, 6).start);
        expect(union.slot.end).toEqual(createSlot(1, 6).end);
      }

      const intersection = applySetOperation('intersection', slots);
      expect(intersection.type).toBe('empty');
    });
  });
}); 