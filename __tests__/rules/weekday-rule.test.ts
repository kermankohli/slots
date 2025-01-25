import { DateTime } from 'luxon';
import { keepWeekdaysRule, removeWeekdaysRule } from '../../src/rules/weekday-rule';
import { Slot } from '../../src/types';
import { removeSlots } from '../../src/operations/slot-operations';
import { createSlotFromISO, createSlotWithZone } from '../helpers/slot-test-helpers';

describe('weekday rules', () => {
  describe('keepWeekdaysRule', () => {
    it('should allow all slots when no weekdays are specified', () => {
      const slots = [
        createSlotFromISO('2024-03-18T10:00:00.000Z', '2024-03-18T11:00:00.000Z'), // Monday
        createSlotFromISO('2024-03-19T10:00:00.000Z', '2024-03-19T11:00:00.000Z'), // Tuesday
      ];
  
      const rule = keepWeekdaysRule();
      const forbiddenSlots = rule(slots);
  
      expect(forbiddenSlots).toHaveLength(0);
    });
  
    it('should filter out slots not on allowed weekdays', () => {
      const slots = [
        createSlotFromISO('2024-03-18T10:00:00.000Z', '2024-03-18T11:00:00.000Z'), // Monday (1)
        createSlotFromISO('2024-03-19T10:00:00.000Z', '2024-03-19T11:00:00.000Z'), // Tuesday (2)
        createSlotFromISO('2024-03-20T10:00:00.000Z', '2024-03-20T11:00:00.000Z'), // Wednesday (3)
      ];
  
      const rule = keepWeekdaysRule([1, 3]); // Keep Monday and Wednesday
      const forbiddenSlots = rule(slots);
  
      expect(forbiddenSlots).toHaveLength(1);
      expect(forbiddenSlots[0].start.weekday).toBe(2); // Tuesday should be forbidden
    });

    it('should allow slots on specified weekdays', () => {
      // Monday
      const slot = createSlotWithZone('2024-03-18T10:00:00', 'UTC');
      const rule = keepWeekdaysRule([1]); // Monday
      const forbidden = rule([slot]);
      expect(forbidden).toHaveLength(0);
    });
  });

  describe('removeWeekdaysRule', () => {
    it('should allow all slots when no weekdays are forbidden', () => {
      const slots = [
        createSlotFromISO('2024-03-18T10:00:00.000Z', '2024-03-18T11:00:00.000Z'), // Monday
        createSlotFromISO('2024-03-19T10:00:00.000Z', '2024-03-19T11:00:00.000Z'), // Tuesday
      ];
  
      const rule = removeWeekdaysRule();
      const forbiddenSlots = rule(slots);
  
      expect(forbiddenSlots).toHaveLength(0);
    });

    it('should filter out slots on forbidden weekdays', () => {
      const slots = [
        createSlotFromISO('2024-03-22T10:00:00.000Z', '2024-03-22T11:00:00.000Z'), // Friday (5)
        createSlotFromISO('2024-03-23T10:00:00.000Z', '2024-03-23T11:00:00.000Z'), // Saturday (6)
        createSlotFromISO('2024-03-24T10:00:00.000Z', '2024-03-24T11:00:00.000Z'), // Sunday (7)
      ];
  
      const rule = removeWeekdaysRule([6, 7]); // Forbid weekends
      const forbiddenSlots = rule(slots);
  
      expect(forbiddenSlots).toHaveLength(2);
      expect(forbiddenSlots[0].start.weekday).toBe(6); // Saturday should be forbidden
      expect(forbiddenSlots[1].start.weekday).toBe(7); // Sunday should be forbidden
    });

    it('should correctly return remaining slots after subtracting forbidden slots', () => {
      const slots = [
        createSlotFromISO('2024-03-18T10:00:00.000Z', '2024-03-18T11:00:00.000Z'), // Monday (1)
        createSlotFromISO('2024-03-19T10:00:00.000Z', '2024-03-19T11:00:00.000Z'), // Tuesday (2)
        createSlotFromISO('2024-03-20T10:00:00.000Z', '2024-03-20T11:00:00.000Z'), // Wednesday (3)
        createSlotFromISO('2024-03-21T10:00:00.000Z', '2024-03-21T11:00:00.000Z'), // Thursday (4)
        createSlotFromISO('2024-03-22T10:00:00.000Z', '2024-03-22T11:00:00.000Z'), // Friday (5)
      ];

      const rule = removeWeekdaysRule([2, 4]); // Forbid Tuesday and Thursday
      const forbiddenSlots = rule(slots);
      const remainingSlots = removeSlots(forbiddenSlots)(slots).data;

      // Should have 3 remaining slots (Mon, Wed, Fri)
      expect(remainingSlots).toHaveLength(3);
      expect(remainingSlots[0].start.weekday).toBe(1); // Monday
      expect(remainingSlots[1].start.weekday).toBe(3); // Wednesday
      expect(remainingSlots[2].start.weekday).toBe(5); // Friday
    });
  });

  describe('timezone handling', () => {
    it('should respect timezone when determining weekday - UTC vs EST', () => {
      // 23:00 UTC Monday = 18:00 EST Monday
      const mondaySlot = createSlotWithZone('2024-03-18T23:00:00Z', 'UTC');
      // 00:00 UTC Tuesday = 19:00 EST Monday
      const tuesdayUtcSlot = createSlotWithZone('2024-03-19T00:00:00Z', 'UTC');
      
      const slots = [mondaySlot, tuesdayUtcSlot];
      
      // Only allow Mondays
      const rule = keepWeekdaysRule([1]);
      const forbiddenSlots = rule(slots);

      // In UTC: first slot is Monday (allowed), second is Tuesday (forbidden)
      expect(forbiddenSlots).toHaveLength(1);
      expect(forbiddenSlots[0].start.toUTC().toISO()).toBe(tuesdayUtcSlot.start.toUTC().toISO());
    });

    it('should handle date line crossing', () => {
      // Create slots at 23:00 Sunday in Tokyo (14:00 Sunday UTC)
      const tokyoSlot = createSlotWithZone('2024-03-17T23:00:00+09:00', 'Asia/Tokyo');
      // Same time in LA would be 07:00 Sunday
      const laSlot = createSlotWithZone('2024-03-17T07:00:00-07:00', 'America/Los_Angeles');
      
      const slots = [tokyoSlot, laSlot];
      
      // Forbid Sundays
      const rule = removeWeekdaysRule([7]);
      const forbiddenSlots = rule(slots);

      // Both slots should be forbidden as they're both on Sunday in their respective zones
      expect(forbiddenSlots).toHaveLength(2);
    });

    it('should handle DST transitions', () => {
      // During US DST transition (second Sunday in March)
      const beforeDst = createSlotWithZone('2024-03-10T01:30:00', 'America/New_York');
      const afterDst = createSlotWithZone('2024-03-10T03:30:00', 'America/New_York');
      
      const slots = [beforeDst, afterDst];
      
      // Forbid Sundays
      const rule = removeWeekdaysRule([7]);
      const forbiddenSlots = rule(slots);

      // Both slots should be forbidden as they're both on Sunday
      expect(forbiddenSlots).toHaveLength(2);
    });
  });

  describe('weekday rules with set operations', () => {
    it('should correctly handle weekday rules followed by intersection', () => {
      // Create two sets of slots across the week
      const slotsSetA = [
        createSlotFromISO('2024-03-18T10:00:00.000Z', '2024-03-18T11:00:00.000Z'), // Monday
        createSlotFromISO('2024-03-19T10:00:00.000Z', '2024-03-19T11:00:00.000Z'), // Tuesday
        createSlotFromISO('2024-03-20T10:00:00.000Z', '2024-03-20T11:00:00.000Z'), // Wednesday
        createSlotFromISO('2024-03-21T10:00:00.000Z', '2024-03-21T11:00:00.000Z'), // Thursday
      ];

      const slotsSetB = [
        createSlotFromISO('2024-03-19T10:00:00.000Z', '2024-03-19T11:00:00.000Z'), // Tuesday
        createSlotFromISO('2024-03-20T10:00:00.000Z', '2024-03-20T11:00:00.000Z'), // Wednesday
        createSlotFromISO('2024-03-21T10:00:00.000Z', '2024-03-21T11:00:00.000Z'), // Thursday
        createSlotFromISO('2024-03-22T10:00:00.000Z', '2024-03-22T11:00:00.000Z'), // Friday
      ];

      // Allow only Mon-Wed for set A
      const ruleA = keepWeekdaysRule([1, 2, 3]);
      const forbiddenSlotsA = ruleA(slotsSetA);
      const remainingSlotsA = removeSlots(forbiddenSlotsA)(slotsSetA).data;

      // Allow only Wed-Fri for set B
      const ruleB = keepWeekdaysRule([3, 4, 5]);
      const forbiddenSlotsB = ruleB(slotsSetB);
      const remainingSlotsB = removeSlots(forbiddenSlotsB)(slotsSetB).data;

      // Find intersection - should only contain Wednesday slots
      const intersection = remainingSlotsA.filter(slotA => 
        remainingSlotsB.some(slotB => 
          slotA.start.toISO() === slotB.start.toISO()
        )
      );

      expect(intersection).toHaveLength(1);
      expect(intersection[0].start.weekday).toBe(3); // Wednesday
    });
  });
}); 