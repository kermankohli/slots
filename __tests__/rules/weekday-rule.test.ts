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
}); 