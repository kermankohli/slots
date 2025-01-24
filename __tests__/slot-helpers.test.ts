import { DateTime, Duration } from 'luxon';
import { doSlotsOverlap, mergeSlots, mergeOverlappingSlots, generateSlots } from '../src/utils/slot-helpers';
import { Slot, MetadataMerger, defaultMetadataMerger } from '../src/types';

describe('slot helpers', () => {
  const baseDate = DateTime.fromISO('2024-01-01T10:00:00Z');
  
  const createSlot = (startHours: number, endHours: number, metadata: Record<string, any> = {}): Slot => ({
    start: baseDate.plus({ hours: startHours }),
    end: baseDate.plus({ hours: endHours }),
    metadata
  });

  describe('doSlotsOverlap', () => {
    it('should detect strictly overlapping slots', () => {
      expect(doSlotsOverlap(createSlot(1, 3), createSlot(2, 4))).toBe(true);
      expect(doSlotsOverlap(createSlot(1, 4), createSlot(2, 3))).toBe(true);
      expect(doSlotsOverlap(createSlot(1, 2), createSlot(2, 3))).toBe(false); // Adjacent slots
    });

    it('should detect inclusive overlapping slots', () => {
      expect(doSlotsOverlap(createSlot(1, 3), createSlot(2, 4), 'inclusive')).toBe(true);
      expect(doSlotsOverlap(createSlot(1, 4), createSlot(2, 3), 'inclusive')).toBe(true);
      expect(doSlotsOverlap(createSlot(1, 2), createSlot(2, 3), 'inclusive')).toBe(true); // Adjacent slots
    });

    it('should detect non-overlapping slots', () => {
      expect(doSlotsOverlap(createSlot(1, 2), createSlot(3, 4))).toBe(false);
      expect(doSlotsOverlap(createSlot(3, 4), createSlot(1, 2))).toBe(false);
      // Same for inclusive
      expect(doSlotsOverlap(createSlot(1, 2), createSlot(3, 4), 'inclusive')).toBe(false);
      expect(doSlotsOverlap(createSlot(3, 4), createSlot(1, 2), 'inclusive')).toBe(false);
    });
  });

  describe('mergeSlots', () => {
    it('should merge slots with default metadata merger', () => {
      const result = mergeSlots(
        createSlot(1, 3, { a: 1, b: 2 }),
        createSlot(2, 4, { b: 3, c: 4 })
      );
      expect(result.start).toEqual(createSlot(1, 4).start);
      expect(result.end).toEqual(createSlot(1, 4).end);
      expect(result.metadata).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should use custom metadata merger', () => {
      const customMerger: MetadataMerger = (meta1, meta2) => ({
        values: [...(meta1.values || []), ...(meta2.values || [])]
      });

      const result = mergeSlots(
        createSlot(1, 3, { values: [1, 2] }),
        createSlot(2, 4, { values: [3, 4] }),
        customMerger
      );
      expect(result.metadata).toEqual({ values: [1, 2, 3, 4] });
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

    describe('with strict overlap strategy', () => {
      it('should merge only strictly overlapping slots', () => {
        const slots = [
          createSlot(1, 3, { count: 1 }),
          createSlot(2, 4, { count: 2 }),
          createSlot(4, 5, { count: 3 }) // Touches but doesn't overlap
        ];

        const result = mergeOverlappingSlots(slots);
        expect(result).toHaveLength(2);
        expect(result[0].metadata).toEqual({ count: 2 }); // First two merged
        expect(result[1].metadata).toEqual({ count: 3 }); // Third stays separate
      });
    });

    describe('with inclusive overlap strategy', () => {
      it('should merge touching slots', () => {
        const slots = [
          createSlot(1, 2, { count: 1 }),
          createSlot(2, 3, { count: 2 }),
          createSlot(3, 4, { count: 3 })
        ];

        const result = mergeOverlappingSlots(slots, defaultMetadataMerger, 'inclusive');
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          ...createSlot(1, 4),
          metadata: { count: 3 } // Last value wins with default merger
        });
      });
    });

    it('should handle multiple overlapping slots in original order', () => {
      const slots = [
        createSlot(3, 4, { value: 3 }),
        createSlot(1, 2, { value: 1 }),
        createSlot(1.5, 3.5, { value: 2 })
      ];
      const result = mergeOverlappingSlots(slots);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...createSlot(1, 4),
        metadata: { value: 3 } // Last value in original array
      });
    });
  });

  describe('generateSlots', () => {
    const hour = Duration.fromObject({ hours: 1 });

    it('should generate slots with given duration and overlap', () => {
      const start = DateTime.fromISO('2024-01-01T10:00:00Z');
      const end = DateTime.fromISO('2024-01-01T12:00:00Z');
      const slots = generateSlots(start, end, hour, Duration.fromObject({ minutes: 30 }), { type: 'test' });

      expect(slots).toHaveLength(3); // Three one-hour slots with 30-min overlap
      expect(slots[0]).toEqual({
        start: DateTime.fromISO('2024-01-01T10:00:00Z'),
        end: DateTime.fromISO('2024-01-01T11:00:00Z'),
        metadata: { type: 'test' }
      });
      expect(slots[1]).toEqual({
        start: DateTime.fromISO('2024-01-01T10:30:00Z'),
        end: DateTime.fromISO('2024-01-01T11:30:00Z'),
        metadata: { type: 'test' }
      });
      expect(slots[2]).toEqual({
        start: DateTime.fromISO('2024-01-01T11:00:00Z'),
        end: DateTime.fromISO('2024-01-01T12:00:00Z'),
        metadata: { type: 'test' }
      });
    });

    it('should return empty array if start date is after end date', () => {
      const start = DateTime.fromISO('2024-01-01T12:00:00Z');
      const end = DateTime.fromISO('2024-01-01T10:00:00Z');
      const slots = generateSlots(start, end, hour, hour);
      expect(slots).toEqual([]);
    });

    it('should return empty array if start date equals end date', () => {
      const date = DateTime.fromISO('2024-01-01T10:00:00Z');
      const slots = generateSlots(date, date, hour, hour);
      expect(slots).toEqual([]);
    });

    it('should throw error for non-positive duration', () => {
      const start = DateTime.fromISO('2024-01-01T10:00:00Z');
      const end = DateTime.fromISO('2024-01-01T12:00:00Z');
      expect(() => generateSlots(start, end, Duration.fromMillis(0), hour)).toThrow();
      expect(() => generateSlots(start, end, Duration.fromMillis(-hour.toMillis()), hour)).toThrow();
    });

    it('should throw error for non-positive overlap interval', () => {
      const start = DateTime.fromISO('2024-01-01T10:00:00Z');
      const end = DateTime.fromISO('2024-01-01T12:00:00Z');
      expect(() => generateSlots(start, end, hour, Duration.fromMillis(0))).toThrow();
      expect(() => generateSlots(start, end, hour, Duration.fromMillis(-hour.toMillis()))).toThrow();
    });

    it('should apply default empty metadata if not provided', () => {
      const start = DateTime.fromISO('2024-01-01T10:00:00Z');
      const end = DateTime.fromISO('2024-01-01T11:00:00Z');
      const slots = generateSlots(start, end, hour, hour);
      expect(slots[0].metadata).toEqual({});
    });
  });
}); 