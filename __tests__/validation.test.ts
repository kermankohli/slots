import { DateTime } from 'luxon';
import { isSlot } from '../src/utils/validation';
import { Slot } from '../src/types';

describe('isSlot', () => {
  const validSlot: Slot = {
    start: DateTime.fromISO('2024-03-20T10:00:00'),
    end: DateTime.fromISO('2024-03-20T11:00:00'),
    metadata: {
      type: 'test'
    }
  };

  it('should return true for valid slot', () => {
    expect(isSlot(validSlot)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isSlot(null)).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(isSlot('not a slot')).toBe(false);
  });

  it('should return false when start is not a DateTime', () => {
    expect(isSlot({ ...validSlot, start: '2024-03-20' })).toBe(false);
  });

  it('should return false when end is not a DateTime', () => {
    expect(isSlot({ ...validSlot, end: '2024-03-20' })).toBe(false);
  });

  it('should return false when metadata is not an object', () => {
    expect(isSlot({ ...validSlot, metadata: 'not an object' })).toBe(false);
  });

  it('should return false when end is before start', () => {
    const invalidSlot = {
      ...validSlot,
      start: DateTime.fromISO('2024-03-20T11:00:00'),
      end: DateTime.fromISO('2024-03-20T10:00:00')
    };
    expect(isSlot(invalidSlot)).toBe(false);
  });
}); 