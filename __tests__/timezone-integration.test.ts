import { DateTime, Duration } from 'luxon';
import { Slot, MetadataMerger, SlotMetadata } from '../src/types';
import { intersectSlots, removeOverlappingSlots } from '../src/utils/slot-set-operations';
import { generateSlots } from '../src/utils/slot-helpers';
import { addSlots, removeExactSlots } from '../src/operations/slot-operations';
import { removeWeekendsRule } from '../src/rules/weekday-rule';
import { allowTimeRangeRule } from '../src/rules/time-of-day-rule';
import { createBufferRule } from '../src/rules/buffer-rule';

describe('timezone integration', () => {
  describe('complex scheduling scenario', () => {
    it('should correctly handle multi-step timezone operations', () => {
      // Step 1: Create continuous slots for two weeks
      const sydneyStart = DateTime.fromISO('2024-01-15', { zone: 'Australia/Sydney' });
      const sydneyEnd = sydneyStart.plus({ days: 14 });
      const sydneyAllSlots = generateSlots(
        sydneyStart,
        sydneyEnd,
        Duration.fromObject({ hours: 1 }), // 1-hour slots
        Duration.fromObject({ hours: 1 }), // Continuous slots
        { timezone: 'Australia/Sydney', type: 'all-hours' }
      );

      // Verify initial slot generation for Sydney
      expect(sydneyAllSlots.length).toBe(14 * 24); // 14 days * 24 hours
      expect(sydneyAllSlots[0].start.zoneName).toBe('Australia/Sydney');
      expect(sydneyAllSlots[0].start.hour).toBe(0); // Should start at midnight

      const sfStart = DateTime.fromISO('2024-01-15', { zone: 'America/Los_Angeles' });
      const sfEnd = sfStart.plus({ days: 14 });
      const sfAllSlots = generateSlots(
        sfStart,
        sfEnd,
        Duration.fromObject({ hours: 1 }), // 1-hour slots
        Duration.fromObject({ hours: 1 }), // Continuous slots
        { timezone: 'America/Los_Angeles', type: 'all-hours' }
      );

      // Verify initial slot generation for SF
      expect(sfAllSlots.length).toBe(14 * 24); // 14 days * 24 hours
      expect(sfAllSlots[0].start.zoneName).toBe('America/Los_Angeles');
      expect(sfAllSlots[0].start.hour).toBe(0); // Should start at midnight

      // Step 2: Apply working hours rule (9 AM - 5 PM in respective timezones)
      const sydneyWorkingHours = allowTimeRangeRule(9, 17); // 9 AM to 5 PM
      const sfWorkingHours = allowTimeRangeRule(9, 17); // 9 AM to 5 PM

      const sydneyWorkWeek = sydneyWorkingHours(sydneyAllSlots);
      const sfWorkWeek = sfWorkingHours(sfAllSlots);

      // Verify working hours filtering
      expect(sydneyWorkWeek.length).toBe(14 * 8); // 14 days * 8 hours (9 AM - 5 PM)
      expect(sydneyWorkWeek.every(slot => slot.start.hour >= 9 && slot.start.hour < 17)).toBe(true);
      expect(sfWorkWeek.length).toBe(14 * 8); // 14 days * 8 hours (9 AM - 5 PM)
      expect(sfWorkWeek.every(slot => slot.start.hour >= 9 && slot.start.hour < 17)).toBe(true);

      // Remove weekend slots
      const weekendRule = removeWeekendsRule();
      const sydneyWeekdays = removeExactSlots(weekendRule(sydneyWorkWeek))(sydneyWorkWeek).data;
      const sfWeekdays = removeExactSlots(weekendRule(sfWorkWeek))(sfWorkWeek).data;

      expect(sydneyWeekdays.length).toBe(10 * 8); // 10 weekdays * 8 hours
      expect(sydneyWeekdays.every(slot => slot.start.weekday <= 5)).toBe(true);
      expect(sfWeekdays.length).toBe(10 * 8); // 10 weekdays * 8 hours
      expect(sfWeekdays.every(slot => slot.start.weekday <= 5)).toBe(true);

      // Step 4: Remove busy slots with buffer
      // Sydney person has a flight on Jan 16th
      const sydneyBusy: Slot[] = [{
        start: DateTime.fromISO('2024-01-16T10:00', { zone: 'Australia/Sydney' }),
        end: DateTime.fromISO('2024-01-16T15:00', { zone: 'Australia/Sydney' }),
        metadata: { timezone: 'Australia/Sydney', type: 'flight' }
      }];

      // SF person has meetings on Jan 15th
      const sfBusy: Slot[] = [{
        start: DateTime.fromISO('2024-01-15T13:00', { zone: 'America/Los_Angeles' }),
        end: DateTime.fromISO('2024-01-15T16:00', { zone: 'America/Los_Angeles' }),
        metadata: { timezone: 'America/Los_Angeles', type: 'meeting' }
      }];

      // Create buffer rules (30 min before and after busy slots)
      const sydneyBufferRule = createBufferRule(
        slot => slot.metadata.type === 'flight',
        30, // 30 minutes before
        30  // 30 minutes after
      );
      const sfBufferRule = createBufferRule(
        slot => slot.metadata.type === 'meeting',
        30, // 30 minutes before
        30  // 30 minutes after
      );

      // Apply buffer rules to busy slots
      const sydneyBufferedBusy = sydneyBufferRule(sydneyBusy);
      const sfBufferedBusy = sfBufferRule(sfBusy);

      // Remove both busy slots and their buffers in one operation
      // Sydney allows partial slots
      const sydneyAvailable = removeOverlappingSlots(sydneyWeekdays, [...sydneyBusy, ...sydneyBufferedBusy], { 
        edgeStrategy: 'inclusive',
        metadataMerger: (a, b) => ({ ...a })  // Keep original metadata
      });
      // SF requires full hour slots
      const sfAvailable = removeOverlappingSlots(sfWeekdays, [...sfBusy, ...sfBufferedBusy], { 
        edgeStrategy: 'inclusive',
        metadataMerger: (a, b) => ({ ...a }),  // Keep original metadata
        minDuration: Duration.fromObject({ hours: 1 }) // Only keep full hour slots
      });

      // Verify busy slot removal with buffer
      const sydneyFlightDay = DateTime.fromISO('2024-01-16', { zone: 'Australia/Sydney' });
      const sydneyFlightDaySlots = sydneyAvailable.filter(slot => 
        slot.start.toFormat('yyyy-MM-dd') === sydneyFlightDay.toFormat('yyyy-MM-dd')
      );
      expect(sydneyFlightDaySlots.length).toBe(3); // 1 slot before (9:00-9:30), 1 slot after (3:30-4:00), and 1 slot after (4:00-5:00)

      const sfMeetingDay = DateTime.fromISO('2024-01-15', { zone: 'America/Los_Angeles' });
      const sfMeetingDaySlots = sfAvailable.filter(slot => 
        slot.start.toFormat('yyyy-MM-dd') === sfMeetingDay.toFormat('yyyy-MM-dd')
      );

      expect(sfMeetingDaySlots.length).toBe(3); // Only full hour slots: 9:00-12:00 (3 slots)

      // Step 5: Find overlapping availability
      const metadataMerger: MetadataMerger = (a: SlotMetadata, b: SlotMetadata) => ({
        timezone: `${a.timezone} ∩ ${b.timezone}`,
        type: 'overlap'
      });

      const overlappingSlots = intersectSlots(sydneyAvailable, sfAvailable, {
        edgeStrategy: 'inclusive',
        metadataMerger
      });

      // Verify final overlapping slots
      expect(overlappingSlots.length).toBeGreaterThan(0); // Should have some overlaps
      
      // Verify all overlaps are within working hours in both timezones
      for (const slot of overlappingSlots) {
        const sydneyTime = slot.start.setZone('Australia/Sydney');
        const sfTime = slot.start.setZone('America/Los_Angeles');
        
        expect(sydneyTime.hour).toBeGreaterThanOrEqual(9);
        expect(sydneyTime.hour).toBeLessThan(17);
        expect(sfTime.hour).toBeGreaterThanOrEqual(9);
        expect(sfTime.hour).toBeLessThanOrEqual(17);
      }

      // Verify metadata
      for (const slot of overlappingSlots) {
        expect(slot.metadata.type).toBe('overlap');
        expect(slot.metadata.timezone).toBe('Australia/Sydney ∩ America/Los_Angeles');
      }
    });
  });
}); 