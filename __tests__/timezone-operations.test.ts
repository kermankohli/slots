import { DateTime } from 'luxon';
import { Slot, MetadataMerger } from '../src/types';
import { intersectSlots } from '../src/utils/slot-set-operations';

describe('timezone operations', () => {
  describe('intersecting schedules across timezones', () => {
    it('should correctly intersect slots from different timezones', () => {
      // Create slots in Sydney timezone (UTC+11 in January)
      const sydneySlots: Slot[] = [
        {
          start: DateTime.fromISO('2024-01-15T09:00', { zone: 'Australia/Sydney' }),
          end: DateTime.fromISO('2024-01-15T17:00', { zone: 'Australia/Sydney' }),
          metadata: { timezone: 'Australia/Sydney' }
        }
      ];

      // Create slots in San Francisco timezone (UTC-8 in January)
      const sfSlots: Slot[] = [
        {
          start: DateTime.fromISO('2024-01-14T15:00', { zone: 'America/Los_Angeles' }),
          end: DateTime.fromISO('2024-01-14T23:00', { zone: 'America/Los_Angeles' }),
          metadata: { timezone: 'America/Los_Angeles' }
        }
      ];

      // Simple metadata merger that keeps timezone information
      const metadataMerger: MetadataMerger = (a: any, b: any) => ({
        timezone: `${a.timezone} ∩ ${b.timezone}` // Show intersection of timezones
      });

      // When it's 9 AM in Sydney on Jan 15, it's 2 PM (14:00) the previous day in SF
      // The intersection should be 7 hours long (15:00-22:00 SF time / 10:00-17:00 Sydney time)
      const result = intersectSlots(sydneySlots, sfSlots, { 
        edgeStrategy: 'inclusive',
        metadataMerger
      });

      expect(result).toHaveLength(1);
      
      // Convert both times to UTC for comparison
      const intersectionStart = result[0].start.toUTC();
      const intersectionEnd = result[0].end.toUTC();

      // The intersection starts at SF's 3 PM (23:00 UTC)
      expect(intersectionStart.toISO()).toBe('2024-01-14T23:00:00.000Z');
      
      // And ends at Sydney's 5 PM (06:00 UTC next day)
      expect(intersectionEnd.toISO()).toBe('2024-01-15T06:00:00.000Z');
      
      // Verify the duration is 7 hours
      const duration = result[0].end.diff(result[0].start, 'hours').hours;
      expect(duration).toBe(7);

      // Verify the metadata was merged correctly
      expect(result[0].metadata.timezone).toBe('Australia/Sydney ∩ America/Los_Angeles');
    });
  });
}); 