import { DateTime } from 'luxon';
import { Slot } from '../src/types';
import { maxSlotsPerDayRule } from '../src/rules/max-slots-per-day';

describe('Slot Rules', () => {
  describe('maxSlotsPerDayRule', () => {
    const baseDate = DateTime.fromISO('2024-01-01T08:00:00Z').setZone('UTC');
    
    const createSlot = (hourOffset: number, type?: string): Slot => ({
      start: baseDate.plus({ hours: hourOffset }),
      end: baseDate.plus({ hours: hourOffset + 1 }),
      metadata: type ? { type } : {}
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

    it('should handle filtering by type before applying day limit', () => {
      const slots = [
        // Mix of calls and meetings
        createSlot(0, 'call'),   // 8:00
        createSlot(2, 'meeting'), // 10:00
        createSlot(4, 'call'),   // 12:00
        createSlot(6, 'meeting'), // 14:00
        createSlot(8, 'call'),   // 16:00
        createSlot(10, 'call'),  // 18:00
        createSlot(12, 'call'),  // 20:00 - This one should be forbidden
        createSlot(14, 'meeting') // 22:00
      ];

      // Filter to only 'call' type slots before applying rule
      const callSlots = slots.filter(slot => slot.metadata?.type === 'call');
      const rule = maxSlotsPerDayRule(4); // Max 4 calls per day
      const forbidden = rule(callSlots);
      
      expect(forbidden).toHaveLength(1);
      expect(forbidden[0].start).toEqual(baseDate.plus({ hours: 12 }));
      expect(forbidden[0].metadata.type).toBe('call');
    });
  });
}); 