import { DateTime } from 'luxon';
import { createBufferRule } from '../../src/rules';
import { Slot } from '../../src/types';

describe('Buffer Rule', () => {
  const createTestSlot = (
    start: string,
    end: string,
    type: string = 'test'
  ): Slot => ({
    start: DateTime.fromISO(start, { zone: 'UTC' }),
    end: DateTime.fromISO(end, { zone: 'UTC' }),
    metadata: { type }
  });

  it('should create buffer slots before and after matching slots', () => {
    const slots = [
      createTestSlot('2024-03-20T10:00:00Z', '2024-03-20T11:00:00Z', 'meeting'),
      createTestSlot('2024-03-20T14:00:00Z', '2024-03-20T15:00:00Z', 'regular'),
      createTestSlot('2024-03-20T16:00:00Z', '2024-03-20T17:00:00Z', 'meeting'),
    ];

    const meetingBufferRule = createBufferRule(
      slot => slot.metadata.type === 'meeting',
      30, // 30 minutes before
      30  // 30 minutes after
    );

    const bufferSlots = meetingBufferRule(slots);
    
    expect(bufferSlots).toHaveLength(4); // 2 meetings × 2 buffers each
    
    // Check first meeting buffers
    expect(bufferSlots[0].start.toISO()).toBe('2024-03-20T09:30:00.000Z');
    expect(bufferSlots[0].end.toISO()).toBe('2024-03-20T10:00:00.000Z');
    expect(bufferSlots[1].start.toISO()).toBe('2024-03-20T11:00:00.000Z');
    expect(bufferSlots[1].end.toISO()).toBe('2024-03-20T11:30:00.000Z');
    
    // Check second meeting buffers
    expect(bufferSlots[2].start.toISO()).toBe('2024-03-20T15:30:00.000Z');
    expect(bufferSlots[2].end.toISO()).toBe('2024-03-20T16:00:00.000Z');
    expect(bufferSlots[3].start.toISO()).toBe('2024-03-20T17:00:00.000Z');
    expect(bufferSlots[3].end.toISO()).toBe('2024-03-20T17:30:00.000Z');
  });

  it('should handle only before buffers', () => {
    const slots = [
      createTestSlot('2024-03-20T10:00:00Z', '2024-03-20T11:00:00Z', 'flight'),
    ];

    const flightBufferRule = createBufferRule(
      slot => slot.metadata.type === 'flight',
      60, // 1 hour before
      0   // no buffer after
    );

    const bufferSlots = flightBufferRule(slots);
    
    expect(bufferSlots).toHaveLength(1);
    expect(bufferSlots[0].start.toISO()).toBe('2024-03-20T09:00:00.000Z');
    expect(bufferSlots[0].end.toISO()).toBe('2024-03-20T10:00:00.000Z');
    expect(bufferSlots[0].metadata.bufferType).toBe('before');
  });

  it('should handle only after buffers', () => {
    const slots = [
      createTestSlot('2024-03-20T10:00:00Z', '2024-03-20T11:00:00Z', 'flight'),
    ];

    const flightBufferRule = createBufferRule(
      slot => slot.metadata.type === 'flight',
      0,   // no buffer before
      60   // 1 hour after
    );

    const bufferSlots = flightBufferRule(slots);
    
    expect(bufferSlots).toHaveLength(1);
    expect(bufferSlots[0].start.toISO()).toBe('2024-03-20T11:00:00.000Z');
    expect(bufferSlots[0].end.toISO()).toBe('2024-03-20T12:00:00.000Z');
    expect(bufferSlots[0].metadata.bufferType).toBe('after');
  });

  it('should preserve original slot metadata in buffer slots', () => {
    const slots = [
      createTestSlot('2024-03-20T10:00:00Z', '2024-03-20T11:00:00Z', 'meeting'),
    ];
    slots[0].metadata.importance = 'high';

    const bufferRule = createBufferRule(
      slot => slot.metadata.type === 'meeting',
      30,
      30
    );

    const bufferSlots = bufferRule(slots);
    
    expect(bufferSlots).toHaveLength(2);
    expect(bufferSlots[0].metadata.importance).toBe('high');
    expect(bufferSlots[0].metadata.isBuffer).toBe(true);
    expect(bufferSlots[0].metadata.originalSlot).toBe(slots[0]);
  });
}); 