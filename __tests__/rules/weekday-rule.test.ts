import { DateTime } from 'luxon';
import { allowWeekdaysRule, forbidWeekdaysRule } from '../../src/rules/weekday-rule';
import { Slot } from '../../src/types';
import { removeSlots } from '../../src/operations/slot-operations';

describe('weekday rules', () => {
  const createTestSlot = (isoDate: string): Slot => ({
    start: DateTime.fromISO(isoDate),
    end: DateTime.fromISO(isoDate).plus({ hours: 1 }),
    metadata: {}
  });

  describe('allowWeekdaysRule', () => {
    it('should allow all slots when no weekdays are specified', () => {
      const slots = [
        createTestSlot('2024-03-18T10:00:00'), // Monday
        createTestSlot('2024-03-19T10:00:00'), // Tuesday
      ];
  
      const rule = allowWeekdaysRule();
      const forbiddenSlots = rule(slots);
  
      expect(forbiddenSlots).toHaveLength(0);
    });
  
    it('should filter out slots not on allowed weekdays', () => {
      const slots = [
        createTestSlot('2024-03-18T10:00:00'), // Monday (1)
        createTestSlot('2024-03-19T10:00:00'), // Tuesday (2)
        createTestSlot('2024-03-20T10:00:00'), // Wednesday (3)
      ];
  
      const rule = allowWeekdaysRule([1, 3]); // Allow Monday and Wednesday
      const forbiddenSlots = rule(slots);
  
      expect(forbiddenSlots).toHaveLength(1);
      expect(forbiddenSlots[0].start.weekday).toBe(2); // Tuesday should be forbidden
    });
  });

  describe('forbidWeekdaysRule', () => {
    it('should allow all slots when no weekdays are forbidden', () => {
      const slots = [
        createTestSlot('2024-03-18T10:00:00'), // Monday
        createTestSlot('2024-03-19T10:00:00'), // Tuesday
      ];
  
      const rule = forbidWeekdaysRule();
      const forbiddenSlots = rule(slots);
  
      expect(forbiddenSlots).toHaveLength(0);
    });

    it('should filter out slots on forbidden weekdays', () => {
      const slots = [
        createTestSlot('2024-03-22T10:00:00'), // Friday (5)
        createTestSlot('2024-03-23T10:00:00'), // Saturday (6)
        createTestSlot('2024-03-24T10:00:00'), // Sunday (7)
      ];
  
      const rule = forbidWeekdaysRule([6, 7]); // Forbid weekends
      const forbiddenSlots = rule(slots);
  
      expect(forbiddenSlots).toHaveLength(2);
      expect(forbiddenSlots[0].start.weekday).toBe(6); // Saturday should be forbidden
      expect(forbiddenSlots[1].start.weekday).toBe(7); // Sunday should be forbidden
    });

    it('should correctly return remaining slots after subtracting forbidden slots', () => {
      const slots = [
        createTestSlot('2024-03-18T10:00:00'), // Monday (1)
        createTestSlot('2024-03-19T10:00:00'), // Tuesday (2)
        createTestSlot('2024-03-20T10:00:00'), // Wednesday (3)
        createTestSlot('2024-03-21T10:00:00'), // Thursday (4)
        createTestSlot('2024-03-22T10:00:00'), // Friday (5)
      ];

      const rule = forbidWeekdaysRule([2, 4]); // Forbid Tuesday and Thursday
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
    const createTestSlotWithZone = (isoDate: string, zone: string): Slot => ({
      start: DateTime.fromISO(isoDate, { zone }),
      end: DateTime.fromISO(isoDate, { zone }).plus({ hours: 1 }),
      metadata: {}
    });

    it('should respect timezone when determining weekday - UTC vs EST', () => {
      // 23:00 UTC Monday = 18:00 EST Monday
      const mondaySlot = createTestSlotWithZone('2024-03-18T23:00:00Z', 'UTC');
      // 00:00 UTC Tuesday = 19:00 EST Monday
      const tuesdayUtcSlot = createTestSlotWithZone('2024-03-19T00:00:00Z', 'UTC');
      
      const slots = [mondaySlot, tuesdayUtcSlot];
      
      // Only allow Mondays
      const rule = allowWeekdaysRule([1]);
      const forbiddenSlots = rule(slots);

      // In UTC: first slot is Monday (allowed), second is Tuesday (forbidden)
      expect(forbiddenSlots).toHaveLength(1);
      expect(forbiddenSlots[0].start.toUTC().toISO()).toBe(tuesdayUtcSlot.start.toUTC().toISO());
    });

    it('should handle date line crossing', () => {
      // Create slots at 23:00 Sunday in Tokyo (14:00 Sunday UTC)
      const tokyoSlot = createTestSlotWithZone('2024-03-17T23:00:00+09:00', 'Asia/Tokyo');
      // Same time in LA would be 07:00 Sunday
      const laSlot = createTestSlotWithZone('2024-03-17T07:00:00-07:00', 'America/Los_Angeles');
      
      const slots = [tokyoSlot, laSlot];
      
      // Forbid Sundays
      const rule = forbidWeekdaysRule([7]);
      const forbiddenSlots = rule(slots);

      // Both slots should be forbidden as they're both on Sunday in their respective zones
      expect(forbiddenSlots).toHaveLength(2);
    });

    it('should handle DST transitions', () => {
      // During US DST transition (second Sunday in March)
      const beforeDst = createTestSlotWithZone('2024-03-10T01:30:00', 'America/New_York');
      const afterDst = createTestSlotWithZone('2024-03-10T03:30:00', 'America/New_York');
      
      const slots = [beforeDst, afterDst];
      
      // Forbid Sundays
      const rule = forbidWeekdaysRule([7]);
      const forbiddenSlots = rule(slots);

      // Both slots should be forbidden as they're both on Sunday
      expect(forbiddenSlots).toHaveLength(2);
    });
  });

  describe('weekday rules with set operations', () => {
    it('should correctly handle weekday rules followed by intersection', () => {
      // Create two sets of slots across the week
      const slotsSetA = [
        createTestSlot('2024-03-18T10:00:00'), // Monday
        createTestSlot('2024-03-19T10:00:00'), // Tuesday
        createTestSlot('2024-03-20T10:00:00'), // Wednesday
        createTestSlot('2024-03-21T10:00:00'), // Thursday
      ];

      const slotsSetB = [
        createTestSlot('2024-03-19T10:00:00'), // Tuesday
        createTestSlot('2024-03-20T10:00:00'), // Wednesday
        createTestSlot('2024-03-21T10:00:00'), // Thursday
        createTestSlot('2024-03-22T10:00:00'), // Friday
      ];

      // Allow only Mon-Wed for set A
      const ruleA = allowWeekdaysRule([1, 2, 3]);
      const forbiddenSlotsA = ruleA(slotsSetA);
      const remainingSlotsA = removeSlots(forbiddenSlotsA)(slotsSetA).data;

      // Allow only Wed-Fri for set B
      const ruleB = allowWeekdaysRule([3, 4, 5]);
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

    it('should handle weekday rules with timezone-aware intersection', () => {
      const createSlotWithZone = (isoDate: string, zone: string): Slot => ({
        start: DateTime.fromISO(isoDate, { zone }),
        end: DateTime.fromISO(isoDate, { zone }).plus({ hours: 1 }),
        metadata: {}
      });

      // Create slots in different timezones
      const slotsSetA = [
        createSlotWithZone('2024-03-18T23:00:00', 'UTC'),     // Monday 23:00 UTC
        createSlotWithZone('2024-03-19T23:00:00', 'UTC'),     // Tuesday 23:00 UTC
      ];

      const slotsSetB = [
        createSlotWithZone('2024-03-19T04:00:00', 'America/New_York'),  // Tuesday 04:00 EST
        createSlotWithZone('2024-03-20T04:00:00', 'America/New_York'),  // Wednesday 04:00 EST
      ];

      // Allow only Mondays and Tuesdays for set A
      const ruleA = allowWeekdaysRule([1, 2]);
      const forbiddenSlotsA = ruleA(slotsSetA);
      const remainingSlotsA = removeSlots(forbiddenSlotsA)(slotsSetA).data;

      // Allow only Tuesdays and Wednesdays for set B
      const ruleB = allowWeekdaysRule([2, 3]);
      const forbiddenSlotsB = ruleB(slotsSetB);
      const remainingSlotsB = removeSlots(forbiddenSlotsB)(slotsSetB).data;

      // Find intersection using UTC comparison
      const intersection = remainingSlotsA.filter(slotA => 
        remainingSlotsB.some(slotB => 
          slotA.start.toUTC().toISO() === slotB.start.toUTC().toISO()
        )
      );

      // Should have no intersections since the slots don't overlap in time
      expect(intersection).toHaveLength(0);
    });
  });
}); 