import { DateTime } from 'luxon';
import { Slot } from '../src/types';
import { maxSlotsPerDayRule } from '../src/rules/max-slots-per-day';
import { createSlotFromHourOffset } from './helpers/slot-test-helpers';

describe('Slot Rules', () => {
  describe('maxSlotsPerDayRule', () => {

    it('should return empty array when under limit', () => {
      const slots = [
        createSlotFromHourOffset(0, 1),
        createSlotFromHourOffset(2, 3),
        createSlotFromHourOffset(4, 5)
      ];

      const rule = maxSlotsPerDayRule(5);
      const forbidden = rule(slots);
      expect(forbidden).toHaveLength(0);
    });

    it('should return excess slots when over limit', () => {
      const slots = [
        createSlotFromHourOffset(0, 1),  // 10:00-11:00
        createSlotFromHourOffset(2, 3),  // 12:00-13:00
        createSlotFromHourOffset(4, 5),  // 14:00-15:00
        createSlotFromHourOffset(6, 7),  // 16:00-17:00
        createSlotFromHourOffset(8, 9),  // 18:00-19:00
        createSlotFromHourOffset(10, 11)  // 20:00-21:00 - This one should be forbidden
      ];

      const rule = maxSlotsPerDayRule(5);
      const forbidden = rule(slots);
      
      expect(forbidden).toHaveLength(1);
      expect(forbidden[0].start).toEqual(DateTime.fromISO('2024-01-01T10:00:00.000Z', { zone: 'UTC' }));
    });

    it('should handle multiple days', () => {
      const slots = [
        // Day 1 - 6 slots
        createSlotFromHourOffset(0, 1),
        createSlotFromHourOffset(2, 3),
        createSlotFromHourOffset(4, 5),
        createSlotFromHourOffset(6, 7),
        createSlotFromHourOffset(8, 9),
        createSlotFromHourOffset(10, 11),
        // Day 2 - 2 slots (next day)
        {
          start: DateTime.fromISO('2024-01-02T12:00:00.000Z'),
          end: DateTime.fromISO('2024-01-02T13:00:00.000Z'),
          metadata: {}
        },
        {
          start: DateTime.fromISO('2024-01-02T14:00:00.000Z'),
          end: DateTime.fromISO('2024-01-02T15:00:00.000Z'),
          metadata: {}
        }
      ];

      const rule = maxSlotsPerDayRule(5);
      const forbidden = rule(slots);
      
      expect(forbidden).toHaveLength(1);
      expect(forbidden[0].start.toISO()).toEqual(DateTime.fromISO('2024-01-01T10:00:00.000Z', { zone: 'UTC' }).toISO());
    });

    it('should handle filtering by type before applying day limit', () => {
      const slots = [
        // Mix of calls and meetings
        createSlotFromHourOffset(0, 1, { type: 'call' }),   // 8:00
        createSlotFromHourOffset(2, 3, { type: 'meeting' }), // 10:00
        createSlotFromHourOffset(4, 5, { type: 'call' }),   // 12:00
        createSlotFromHourOffset(6, 7, { type: 'meeting' }), // 14:00
        createSlotFromHourOffset(8, 9, { type: 'call' }),   // 16:00
        createSlotFromHourOffset(10, 11, { type: 'call' }),  // 18:00
        createSlotFromHourOffset(12, 13, { type: 'call' }),  // 20:00 - This one should be forbidden
        createSlotFromHourOffset(14, 15, { type: 'meeting' }) // 22:00
      ];

      // Filter to only 'call' type slots before applying rule
      const callSlots = slots.filter(slot => slot.metadata?.type === 'call');
      const rule = maxSlotsPerDayRule(4); // Max 4 calls per day
      const forbidden = rule(callSlots);
      
      expect(forbidden).toHaveLength(1);
      expect(forbidden[0].start.toISO()).toEqual(DateTime.fromISO('2024-01-01T12:00:00.000Z', { zone: 'UTC' }).toISO());
      expect(forbidden[0].metadata.type).toBe('call');
    });
  });
}); 