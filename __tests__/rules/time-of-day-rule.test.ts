import { DateTime } from 'luxon';
import { createTimeOfDayRule } from '../../src/rules/time-of-day-rule';
import { Slot } from '../../src/types';

describe('createTimeOfDayRule timezone handling', () => {
  it('should only block slots between 9 AM - 5 PM in their respective timezones', () => {
    // Rule blocks 9 AM to 5 PM
    const rule = createTimeOfDayRule({ hour: 9 }, { hour: 17 });

    // Test slots in UTC
    const utcDuringBusinessHours: Slot = {
      start: DateTime.fromObject({ hour: 13 }, { zone: 'UTC' }), // 1 PM UTC
      end: DateTime.fromObject({ hour: 14 }, { zone: 'UTC' }), // 2 PM UTC
      metadata: {}
    };

    const utcOutsideBusinessHours: Slot = {
      start: DateTime.fromObject({ hour: 7 }, { zone: 'UTC' }), // 7 AM UTC
      end: DateTime.fromObject({ hour: 8 }, { zone: 'UTC' }), // 8 AM UTC
      metadata: {}
    };

    // Test slots in New York
    const nyDuringBusinessHours: Slot = {
      start: DateTime.fromObject({ hour: 13 }, { zone: 'America/New_York' }), // 1 PM NY
      end: DateTime.fromObject({ hour: 14 }, { zone: 'America/New_York' }), // 2 PM NY
      metadata: {}
    };

    const nyOutsideBusinessHours: Slot = {
      start: DateTime.fromObject({ hour: 7 }, { zone: 'America/New_York' }), // 7 AM NY
      end: DateTime.fromObject({ hour: 8 }, { zone: 'America/New_York' }), // 8 AM NY
      metadata: {}
    };

    const result = rule([
      utcDuringBusinessHours,
      utcOutsideBusinessHours,
      nyDuringBusinessHours,
      nyOutsideBusinessHours
    ]);

    // Slots during business hours (9 AM - 5 PM) should be blocked
    expect(result).toContain(utcDuringBusinessHours);
    expect(result).toContain(nyDuringBusinessHours);

    // Slots outside business hours should not be blocked
    expect(result).not.toContain(utcOutsideBusinessHours);
    expect(result).not.toContain(nyOutsideBusinessHours);
  });
}); 