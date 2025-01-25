import { DateTime, Duration } from 'luxon';
import { doSlotsOverlap, mergeSlots, mergeOverlappingSlots, generateSlots } from '../src/utils/slot-helpers';
import { Slot, MetadataMerger, defaultMetadataMerger } from '../src/types';
import { createSlotFromHourOffset } from './helpers/slot-test-helpers';

describe('slot helpers', () => {
  describe('doSlotsOverlap', () => {
    it('should detect overlapping slots', () => {
      const slotA = createSlotFromHourOffset(0, 2);
      const slotB = createSlotFromHourOffset(1, 3);
      expect(doSlotsOverlap(slotA, slotB)).toBe(true);
    });

    it('should detect non-overlapping slots', () => {
      const slotA = createSlotFromHourOffset(0, 1);
      const slotB = createSlotFromHourOffset(2, 3);
      expect(doSlotsOverlap(slotA, slotB)).toBe(false);
    });

    it('should handle touching slots based on strategy', () => {
      const slotA = createSlotFromHourOffset(0, 1);
      const slotB = createSlotFromHourOffset(1, 2);
      expect(doSlotsOverlap(slotA, slotB, 'strict')).toBe(false);
      expect(doSlotsOverlap(slotA, slotB, 'inclusive')).toBe(true);
    });

    it('should handle zero-duration slots', () => {
      const slotA = createSlotFromHourOffset(1, 1);
      const slotB = createSlotFromHourOffset(1, 2);
      expect(doSlotsOverlap(slotA, slotB)).toBe(true);
    });
  });

  describe('mergeSlots', () => {
    it('should merge slots with default metadata merger', () => {
      const result = mergeSlots(
        createSlotFromHourOffset(1, 3, { a: 1, b: 2 }),
        createSlotFromHourOffset(2, 4, { b: 3, c: 4 })
      );
      expect(result.start).toEqual(createSlotFromHourOffset(1, 4).start);
      expect(result.end).toEqual(createSlotFromHourOffset(1, 4).end);
      expect(result.metadata).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should use custom metadata merger', () => {
      const customMerger: MetadataMerger = (meta1, meta2) => ({
        values: [...(meta1.values || []), ...(meta2.values || [])]
      });

      const result = mergeSlots(
        createSlotFromHourOffset(1, 3, { values: [1, 2] }),
        createSlotFromHourOffset(2, 4, { values: [3, 4] }),
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
      const slot = createSlotFromHourOffset(1, 2);
      expect(mergeOverlappingSlots([slot])).toEqual([slot]);
    });

    describe('with strict overlap strategy', () => {
      it('should merge only strictly overlapping slots', () => {
        const slots = [
          createSlotFromHourOffset(1, 3, { count: 1 }),
          createSlotFromHourOffset(2, 4, { count: 2 }),
          createSlotFromHourOffset(4, 5, { count: 3 }) // Touches but doesn't overlap
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
          createSlotFromHourOffset(1, 2, { count: 1 }),
          createSlotFromHourOffset(2, 3, { count: 2 }),
          createSlotFromHourOffset(3, 4, { count: 3 })
        ];

        const result = mergeOverlappingSlots(slots, defaultMetadataMerger, 'inclusive');
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          ...createSlotFromHourOffset(1, 4),
          metadata: { count: 3 } // Last value wins with default merger
        });
      });
    });

    it('should handle multiple overlapping slots in original order', () => {
      const slots = [
        createSlotFromHourOffset(3, 4, { value: 3 }),
        createSlotFromHourOffset(1, 2, { value: 1 }),
        createSlotFromHourOffset(1.5, 3.5, { value: 2 })
      ];
      const result = mergeOverlappingSlots(slots);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...createSlotFromHourOffset(1, 4),
        metadata: { value: 3 } // Last value in original array
      });
    });
  });

  describe('generateSlots', () => {
    const hour = Duration.fromObject({ hours: 1 });

    it('should generate slots with correct duration and interval', () => {
      const start = DateTime.fromISO('2024-01-01T10:00:00Z', { zone: 'UTC' });
      const end = DateTime.fromISO('2024-01-01T12:00:00Z', { zone: 'UTC' });
      const slots = generateSlots(start, end, hour, hour);

      expect(slots).toHaveLength(2);
      expect(slots[0].start.toISO()).toBe('2024-01-01T10:00:00.000Z');
      expect(slots[0].end.toISO()).toBe('2024-01-01T11:00:00.000Z');
      expect(slots[1].start.toISO()).toBe('2024-01-01T11:00:00.000Z');
      expect(slots[1].end.toISO()).toBe('2024-01-01T12:00:00.000Z');
    });

    it('should handle overlapping slots', () => {
      const start = DateTime.fromISO('2024-01-01T10:00:00Z', { zone: 'UTC' });
      const end = DateTime.fromISO('2024-01-01T12:00:00Z', { zone: 'UTC' });
      const slots = generateSlots(start, end, hour.plus({ minutes: 30 }), hour.minus({ minutes: 30 }));

      expect(slots).toHaveLength(2);
      expect(slots[0].start.toISO()).toBe('2024-01-01T10:00:00.000Z');
      expect(slots[0].end.toISO()).toBe('2024-01-01T11:30:00.000Z');
      expect(slots[1].start.toISO()).toBe('2024-01-01T10:30:00.000Z');
      expect(slots[1].end.toISO()).toBe('2024-01-01T12:00:00.000Z');
    });

    it('should return empty array if start date equals end date', () => {
      const date = DateTime.fromISO('2024-01-01T10:00:00Z', { zone: 'UTC' });
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