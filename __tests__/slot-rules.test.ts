import { DateTime } from 'luxon';
import { Slot } from '../src/types';
import { maxSlotsPerDayRule } from '../src/rules/day-rules';

describe('Slot Rules', () => {
  describe('maxSlotsPerDayRule', () => {
    const baseDate = DateTime.fromISO('2024-01-01T08:00:00Z').setZone('UTC');
    
    const createSlot = (hourOffset: number): Slot => ({
      start: baseDate.plus({ hours: hourOffset }),
      end: baseDate.plus({ hours: hourOffset + 1 }),
      metadata: {}
    });

    it('should return empty array when under limit', () => {
      const slots = [
        createSlot(0),
        createSlot(2),
        createSlot(4)
      ];

      const rule = maxSlotsPerDayRule(5);
      const forbidden = rule(slots);
      expect(forbidden).toHaveLength(0);
    });

    it('should return excess slots when over limit', () => {
      const slots = [
        createSlot(0),  // 10:00
        createSlot(2),  // 12:00
        createSlot(4),  // 14:00
        createSlot(6),  // 16:00
        createSlot(8),  // 18:00
        createSlot(10)  // 20:00 - This one should be forbidden
      ];

      const rule = maxSlotsPerDayRule(5);
      const forbidden = rule(slots);
      
      expect(forbidden).toHaveLength(1);
      expect(forbidden[0].start).toEqual(baseDate.plus({ hours: 10 }));
    });

    it('should handle multiple days', () => {
      const slots = [
        // Day 1 - 6 slots
        createSlot(0),
        createSlot(2),
        createSlot(4),
        createSlot(6),
        createSlot(8),
        createSlot(10),
        // Day 2 - 2 slots (next day)
        {
          start: baseDate.plus({ days: 1, hours: 2 }),
          end: baseDate.plus({ days: 1, hours: 3 }),
          metadata: {}
        },
        {
          start: baseDate.plus({ days: 1, hours: 4 }),
          end: baseDate.plus({ days: 1, hours: 5 }),
          metadata: {}
        }
      ];

      const rule = maxSlotsPerDayRule(5);
      const forbidden = rule(slots);
      
      expect(forbidden).toHaveLength(1);
      expect(forbidden[0].start).toEqual(baseDate.plus({ hours: 10 }));
    });
  });
}); 