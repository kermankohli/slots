import { DateTime } from 'luxon';
import { createBufferRule } from '../../src/rules';
import { Slot } from '../../src/types';
import { createSlotFromISO } from '../helpers/slot-test-helpers';

describe('Buffer Rule', () => {
  it('should create buffer slots before and after matching slots', () => {
    const slots = [
      createSlotFromISO('2024-03-20T10:00:00.000Z', '2024-03-20T11:00:00.000Z', { type: 'meeting' }),
      createSlotFromISO('2024-03-20T14:00:00.000Z', '2024-03-20T15:00:00.000Z', { type: 'regular' }),
      createSlotFromISO('2024-03-20T16:00:00.000Z', '2024-03-20T17:00:00.000Z', { type: 'meeting' }),
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
      createSlotFromISO('2024-03-20T10:00:00.000Z', '2024-03-20T11:00:00.000Z', { type: 'flight' }),
    ];

    const flightBufferRule = createBufferRule(
      slot => slot.metadata.type === 'flight',
      60, // 60 minutes before
      0   // no buffer after
    );

    const bufferSlots = flightBufferRule(slots);
    
    expect(bufferSlots).toHaveLength(1);
    expect(bufferSlots[0].start.toISO()).toBe('2024-03-20T09:00:00.000Z');
    expect(bufferSlots[0].end.toISO()).toBe('2024-03-20T10:00:00.000Z');
  });

  it('should handle only after buffers', () => {
    const slots = [
      createSlotFromISO('2024-03-20T10:00:00.000Z', '2024-03-20T11:00:00.000Z', { type: 'meeting' }),
    ];

    const meetingBufferRule = createBufferRule(
      slot => slot.metadata.type === 'meeting',
      0,  // no buffer before
      45  // 45 minutes after
    );

    const bufferSlots = meetingBufferRule(slots);
    
    expect(bufferSlots).toHaveLength(1);
    expect(bufferSlots[0].start.toISO()).toBe('2024-03-20T11:00:00.000Z');
    expect(bufferSlots[0].end.toISO()).toBe('2024-03-20T11:45:00.000Z');
  });

  it('should handle overlapping buffers', () => {
    const slots = [
      createSlotFromISO('2024-03-20T10:00:00.000Z', '2024-03-20T11:00:00.000Z', { type: 'meeting' }),
      createSlotFromISO('2024-03-20T11:30:00.000Z', '2024-03-20T12:30:00.000Z', { type: 'meeting' }),
    ];

    const meetingBufferRule = createBufferRule(
      slot => slot.metadata.type === 'meeting',
      30,
      30
    );

    const bufferSlots = meetingBufferRule(slots);
    
    expect(bufferSlots).toHaveLength(4);
    // First meeting buffers
    expect(bufferSlots[0].start.toISO()).toBe('2024-03-20T09:30:00.000Z');
    expect(bufferSlots[0].end.toISO()).toBe('2024-03-20T10:00:00.000Z');
    expect(bufferSlots[1].start.toISO()).toBe('2024-03-20T11:00:00.000Z');
    expect(bufferSlots[1].end.toISO()).toBe('2024-03-20T11:30:00.000Z');
    // Second meeting buffers
    expect(bufferSlots[2].start.toISO()).toBe('2024-03-20T11:00:00.000Z');
    expect(bufferSlots[2].end.toISO()).toBe('2024-03-20T11:30:00.000Z');
    expect(bufferSlots[3].start.toISO()).toBe('2024-03-20T12:30:00.000Z');
    expect(bufferSlots[3].end.toISO()).toBe('2024-03-20T13:00:00.000Z');
  });

  it('should handle zero buffer times', () => {
    const slots = [
      createSlotFromISO('2024-03-20T10:00:00.000Z', '2024-03-20T11:00:00.000Z', { type: 'meeting' }),
    ];

    const meetingBufferRule = createBufferRule(
      slot => slot.metadata.type === 'meeting',
      0,
      0
    );

    const bufferSlots = meetingBufferRule(slots);
    expect(bufferSlots).toHaveLength(0);
  });

  it('should handle non-matching slots', () => {
    const slots = [
      createSlotFromISO('2024-03-20T10:00:00.000Z', '2024-03-20T11:00:00.000Z', { type: 'regular' }),
    ];

    const meetingBufferRule = createBufferRule(
      slot => slot.metadata.type === 'meeting',
      30,
      30
    );

    const bufferSlots = meetingBufferRule(slots);
    expect(bufferSlots).toHaveLength(0);
  });
}); 