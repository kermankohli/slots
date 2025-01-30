import { DateTime, Duration } from 'luxon';
import { Slot, SlotOperationOptions } from '../src/types';
import {
  intersectSlots,
  unionSlots,
  removeOverlappingSlots,
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

  describe('removeOverlappingSlots with arrays', () => {
    it('should return all slots from A when B is empty', () => {
      const slotsA = [
        createSlotFromISO('2024-03-18T10:00:00.000Z', '2024-03-18T11:00:00.000Z')
      ];
      const slotsB: Slot[] = [];

      const result = removeOverlappingSlots(slotsA, slotsB, defaultOptions);
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

      const result = removeOverlappingSlots(slotsA, slotsB, defaultOptions);
      expect(result).toHaveLength(2);
      expect(result[0].start.toISO()).toBe('2024-03-18T10:00:00.000Z');
      expect(result[0].end.toISO()).toBe('2024-03-18T11:00:00.000Z');
      expect(result[1].start.toISO()).toBe('2024-03-18T12:00:00.000Z');
      expect(result[1].end.toISO()).toBe('2024-03-18T13:00:00.000Z');
    });

    it('should maintain original slot durations when removing overlapping slots', () => {
      // Create a series of 1-hour slots
      const hourlySlots: Slot[] = [
        createSlotFromISO('2024-03-18T09:00:00.000Z', '2024-03-18T10:00:00.000Z'),
        createSlotFromISO('2024-03-18T10:00:00.000Z', '2024-03-18T11:00:00.000Z'),
        createSlotFromISO('2024-03-18T11:00:00.000Z', '2024-03-18T12:00:00.000Z'),
        createSlotFromISO('2024-03-18T12:00:00.000Z', '2024-03-18T13:00:00.000Z')
      ];

      // Create a blocking slot that overlaps with some hours
      const blockingSlots: Slot[] = [{
        start: DateTime.fromISO('2024-03-18T10:30:00.000Z', { zone: 'UTC' }),
        end: DateTime.fromISO('2024-03-18T11:30:00.000Z', { zone: 'UTC' }),
        metadata: {}
      }];

      const options: SlotOperationOptions = {
        edgeStrategy: 'exclusive',
        metadataMerger: (a, b) => ({ ...a, ...b }),
        minDuration: Duration.fromObject({ minutes: 60 })
      };

      const result = removeOverlappingSlots(hourlySlots, blockingSlots, options);

      // We expect:
      // 1. The 9-10 slot should remain unchanged (1 hour)
      // 2. The 12-13 slot should remain unchanged (1 hour)
      // The partial slots 10:00-10:30 and 11:30-12:00 should be filtered out as they're less than 1 hour
      expect(result).toHaveLength(2);
      
      // Check first slot is unchanged (9-10)
      expect(result[0].start.toISO()).toBe('2024-03-18T09:00:00.000Z');
      expect(result[0].end.toISO()).toBe('2024-03-18T10:00:00.000Z');

      // Check last slot is unchanged (12-13)
      expect(result[1].start.toISO()).toBe('2024-03-18T12:00:00.000Z');
      expect(result[1].end.toISO()).toBe('2024-03-18T13:00:00.000Z');

      // Verify all slots have appropriate durations
      result.forEach(slot => {
        const durationInMinutes = slot.end.diff(slot.start).as('minutes');
        expect(durationInMinutes).toBe(60); // All slots should be exactly 1 hour
      });
    });

    it('should handle multiple blocking slots while maintaining durations', () => {
      const hourlySlots: Slot[] = [
        createSlotFromISO('2024-03-18T09:00:00.000Z', '2024-03-18T10:00:00.000Z'),
        createSlotFromISO('2024-03-18T10:00:00.000Z', '2024-03-18T11:00:00.000Z'),
        createSlotFromISO('2024-03-18T11:00:00.000Z', '2024-03-18T12:00:00.000Z')
      ];

      const blockingSlots: Slot[] = [
        createSlotFromISO('2024-03-18T09:30:00.000Z', '2024-03-18T10:15:00.000Z'),
        createSlotFromISO('2024-03-18T10:45:00.000Z', '2024-03-18T11:30:00.000Z')
      ];

      const options: SlotOperationOptions = {
        edgeStrategy: 'exclusive',
        metadataMerger: (a, b) => ({ ...a, ...b }),
        minDuration: Duration.fromObject({ minutes: 60 })
      };

      const result = removeOverlappingSlots(hourlySlots, blockingSlots, options);

      // With minDuration of 60 minutes, we expect no slots to remain
      // because all remaining segments would be less than 1 hour:
      // - 09:00-09:30 (30 min)
      // - 10:15-10:45 (30 min)
      // - 11:30-12:00 (30 min)
      expect(result).toHaveLength(0);
    });

    it('should maintain slot structure across timezone changes', () => {
      // Create slots in Sydney timezone
      const sydneySlots: Slot[] = [
        {
          start: DateTime.fromISO('2025-02-04T09:00:00.000', { zone: 'Australia/Sydney' }),
          end: DateTime.fromISO('2025-02-04T10:00:00.000', { zone: 'Australia/Sydney' }),
          metadata: {}
        },
        {
          start: DateTime.fromISO('2025-02-04T10:00:00.000', { zone: 'Australia/Sydney' }),
          end: DateTime.fromISO('2025-02-04T11:00:00.000', { zone: 'Australia/Sydney' }),
          metadata: {}
        },
        {
          start: DateTime.fromISO('2025-02-04T11:00:00.000', { zone: 'Australia/Sydney' }),
          end: DateTime.fromISO('2025-02-04T12:00:00.000', { zone: 'Australia/Sydney' }),
          metadata: {}
        }
      ];

      // Create blocking slot in Calcutta timezone
      const calcuttaSlots: Slot[] = [{
        start: DateTime.fromISO('2025-02-04T03:30:00.000', { zone: 'Asia/Calcutta' }),
        end: DateTime.fromISO('2025-02-04T04:30:00.000', { zone: 'Asia/Calcutta' }),
        metadata: { type: 'meeting' }
      }];

      const options: SlotOperationOptions = {
        edgeStrategy: 'exclusive',
        metadataMerger: (a, b) => ({ ...a, ...b }),
        minDuration: Duration.fromObject({ minutes: 60 })
      };

      const result = removeOverlappingSlots(sydneySlots, calcuttaSlots, options);

      // Log for debugging
      console.log('Result slots:', result.map(slot => ({
        start: slot.start.toFormat('HH:mm ZZZZ'),
        end: slot.end.toFormat('HH:mm ZZZZ'),
        duration: slot.end.diff(slot.start).as('minutes')
      })));

      // Verify we maintain original slot structure
      expect(result.length).toBeGreaterThan(0);
      
      // Verify all remaining slots are exactly 1 hour
      result.forEach(slot => {
        const durationInMinutes = slot.end.diff(slot.start).as('minutes');
        expect(durationInMinutes).toBe(60);
      });

      // Verify timezone information is preserved
      result.forEach(slot => {
        expect(slot.start.zoneName).toBe('Australia/Sydney');
        expect(slot.end.zoneName).toBe('Australia/Sydney');
      });
    });

    it('should handle multiple timezone changes while maintaining slot structure', () => {
      // Create work week slots in Sydney timezone
      const workWeekSlots: Slot[] = [
        {
          start: DateTime.fromISO('2025-02-04T09:00:00.000', { zone: 'Australia/Sydney' }),
          end: DateTime.fromISO('2025-02-04T17:00:00.000', { zone: 'Australia/Sydney' }),
          metadata: {}
        },
        {
          start: DateTime.fromISO('2025-02-06T09:00:00.000', { zone: 'Australia/Sydney' }),
          end: DateTime.fromISO('2025-02-06T17:00:00.000', { zone: 'Australia/Sydney' }),
          metadata: {}
        }
      ];

      // Create location change slots in Calcutta timezone
      const locationChangeSlots: Slot[] = [
        {
          start: DateTime.fromISO('2025-02-04T16:00:00.000', { zone: 'Asia/Calcutta' }),
          end: DateTime.fromISO('2025-02-05T00:00:00.000', { zone: 'Asia/Calcutta' }),
          metadata: { isLocationChange: true }
        },
        {
          start: DateTime.fromISO('2025-02-05T21:55:00.000', { zone: 'Asia/Calcutta' }),
          end: DateTime.fromISO('2025-02-06T05:55:00.000', { zone: 'Asia/Calcutta' }),
          metadata: { isLocationChange: true }
        }
      ];

      const options: SlotOperationOptions = {
        edgeStrategy: 'exclusive',
        metadataMerger: (a, b) => ({ ...a, ...b }),
        minDuration: Duration.fromObject({ minutes: 60 })
      };

      const result = removeOverlappingSlots(workWeekSlots, locationChangeSlots, options);

      // Log for debugging
      console.log('Result slots:', result.map(slot => ({
        start: slot.start.toFormat('yyyy-MM-dd HH:mm ZZZZ'),
        end: slot.end.toFormat('yyyy-MM-dd HH:mm ZZZZ'),
        duration: slot.end.diff(slot.start).as('hours')
      })));

      // Verify we get some results
      expect(result.length).toBeGreaterThan(0);

      // Verify all slots maintain minimum duration
      result.forEach(slot => {
        const durationInHours = slot.end.diff(slot.start).as('hours');
        expect(durationInHours).toBeGreaterThanOrEqual(1);
      });

      // Verify timezone information is preserved
      result.forEach(slot => {
        expect(slot.start.zoneName).toBe('Australia/Sydney');
        expect(slot.end.zoneName).toBe('Australia/Sydney');
      });
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