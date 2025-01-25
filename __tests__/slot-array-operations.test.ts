import { DateTime } from 'luxon';
import { Slot } from '../src/types';
import {
  intersectSlots,
  unionSlots,
  differenceSlots,
  symmetricDifferenceSlots,
} from '../src/utils/slot-set-operations';
import { createSlotFromISO } from './helpers/slot-test-helpers';

describe('slot array operations', () => {
  const defaultOptions = {
    metadataMerger: (a: any, b: any) => ({ ...a, ...b }),
    edgeStrategy: 'inclusive' as const
  };

  describe('intersectSlots with arrays', () => {
    it('should return empty array when no slots overlap', () => {
      const slotsA = [
        createSlotFromISO('2024-03-18T10:00:00.000Z', '2024-03-18T11:00:00.000Z'),
        createSlotFromISO('2024-03-18T12:00:00.000Z', '2024-03-18T13:00:00.000Z')
      ];
      const slotsB = [
        createSlotFromISO('2024-03-18T11:00:00.000Z', '2024-03-18T12:00:00.000Z'),
        createSlotFromISO('2024-03-18T13:00:00.000Z', '2024-03-18T14:00:00.000Z')
      ];

      const result = intersectSlots(slotsA, slotsB, {...defaultOptions, edgeStrategy: 'exclusive'});
      expect(result).toHaveLength(0);
    });

    it('should find overlapping portions of slots', () => {
      const slotsA = [
        createSlotFromISO('2024-03-18T10:00:00.000Z', '2024-03-18T12:00:00.000Z')
      ];
      const slotsB = [
        createSlotFromISO('2024-03-18T11:00:00.000Z', '2024-03-18T13:00:00.000Z')
      ];

      const result = intersectSlots(slotsA, slotsB, defaultOptions);
      expect(result).toHaveLength(1);
      expect(result[0].start.toISO()).toBe('2024-03-18T11:00:00.000Z');
      expect(result[0].end.toISO()).toBe('2024-03-18T12:00:00.000Z');
    });

    it('should merge overlapping intersections', () => {
      const slotsA = [
        createSlotFromISO('2024-03-18T10:00:00.000Z', '2024-03-18T12:00:00.000Z'),
        createSlotFromISO('2024-03-18T11:30:00.000Z', '2024-03-18T13:30:00.000Z')
      ];
      const slotsB = [
        createSlotFromISO('2024-03-18T11:00:00.000Z', '2024-03-18T13:00:00.000Z')
      ];

      const result = intersectSlots(slotsA, slotsB, defaultOptions);
      expect(result).toHaveLength(1);
      expect(result[0].start.toISO()).toBe('2024-03-18T11:00:00.000Z');
      expect(result[0].end.toISO()).toBe('2024-03-18T13:00:00.000Z');
    });
  });

  describe('unionSlots with arrays', () => {
    it('should merge overlapping slots from both arrays', () => {
      const slotsA = [
        createSlotFromISO('2024-03-18T10:00:00.000Z', '2024-03-18T12:00:00.000Z')
      ];
      const slotsB = [
        createSlotFromISO('2024-03-18T11:00:00.000Z', '2024-03-18T13:00:00.000Z')
      ];

      const result = unionSlots(slotsA, slotsB, defaultOptions);
      expect(result).toHaveLength(1);
      expect(result[0].start.toISO()).toBe('2024-03-18T10:00:00.000Z');
      expect(result[0].end.toISO()).toBe('2024-03-18T13:00:00.000Z');
    });

    it('should keep non-overlapping slots separate', () => {
      const slotsA = [
        createSlotFromISO('2024-03-18T10:00:00.000Z', '2024-03-18T11:00:00.000Z')
      ];
      const slotsB = [
        createSlotFromISO('2024-03-18T12:00:00.000Z', '2024-03-18T13:00:00.000Z')
      ];

      const result = unionSlots(slotsA, slotsB, defaultOptions);
      expect(result).toHaveLength(2);
      expect(result[0].start.toISO()).toBe('2024-03-18T10:00:00.000Z');
      expect(result[1].start.toISO()).toBe('2024-03-18T12:00:00.000Z');
    });
  });

  describe('differenceSlots with arrays', () => {
    it('should return all slots from A when B is empty', () => {
      const slotsA = [
        createSlotFromISO('2024-03-18T10:00:00.000Z', '2024-03-18T11:00:00.000Z')
      ];
      const slotsB: Slot[] = [];

      const result = differenceSlots(slotsA, slotsB, defaultOptions);
      expect(result).toHaveLength(1);
      expect(result[0].start.toISO()).toBe('2024-03-18T10:00:00.000Z');
    });

    it('should return portions of A not overlapped by B', () => {
      const slotsA = [
        createSlotFromISO('2024-03-18T10:00:00.000Z', '2024-03-18T13:00:00.000Z')
      ];
      const slotsB = [
        createSlotFromISO('2024-03-18T11:00:00.000Z', '2024-03-18T12:00:00.000Z')
      ];

      const result = differenceSlots(slotsA, slotsB, defaultOptions);
      expect(result).toHaveLength(2);
      expect(result[0].start.toISO()).toBe('2024-03-18T10:00:00.000Z');
      expect(result[0].end.toISO()).toBe('2024-03-18T11:00:00.000Z');
      expect(result[1].start.toISO()).toBe('2024-03-18T12:00:00.000Z');
      expect(result[1].end.toISO()).toBe('2024-03-18T13:00:00.000Z');
    });
  });

  describe('symmetricDifferenceSlots with arrays', () => {
    it('should return portions unique to each array', () => {
      const slotsA = [
        createSlotFromISO('2024-03-18T10:00:00.000Z', '2024-03-18T12:00:00.000Z')
      ];
      const slotsB = [
        createSlotFromISO('2024-03-18T11:00:00.000Z', '2024-03-18T13:00:00.000Z')
      ];

      const result = symmetricDifferenceSlots(slotsA, slotsB, defaultOptions);
      expect(result).toHaveLength(2);
      expect(result[0].start.toISO()).toBe('2024-03-18T10:00:00.000Z');
      expect(result[0].end.toISO()).toBe('2024-03-18T11:00:00.000Z');
      expect(result[1].start.toISO()).toBe('2024-03-18T12:00:00.000Z');
      expect(result[1].end.toISO()).toBe('2024-03-18T13:00:00.000Z');
    });

    it('should handle multiple overlapping slots', () => {
      const slotsA = [
        createSlotFromISO('2024-03-18T10:00:00.000Z', '2024-03-18T12:00:00.000Z'),
        createSlotFromISO('2024-03-18T14:00:00.000Z', '2024-03-18T16:00:00.000Z')
      ];
      const slotsB = [
        createSlotFromISO('2024-03-18T11:00:00.000Z', '2024-03-18T15:00:00.000Z')
      ];

      const result = symmetricDifferenceSlots(slotsA, slotsB, defaultOptions);
      expect(result).toHaveLength(3);
      // A unique part (10:00-11:00)
      expect(result[0].start.toISO()).toBe('2024-03-18T10:00:00.000Z');
      expect(result[0].end.toISO()).toBe('2024-03-18T11:00:00.000Z');
      // B unique part (12:00-14:00)
      expect(result[1].start.toISO()).toBe('2024-03-18T12:00:00.000Z');
      expect(result[1].end.toISO()).toBe('2024-03-18T14:00:00.000Z');
      // B unique part (15:00-16:00)
      expect(result[2].start.toISO()).toBe('2024-03-18T15:00:00.000Z');
      expect(result[2].end.toISO()).toBe('2024-03-18T16:00:00.000Z');
    });
  });
}); 