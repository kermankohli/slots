import { DateTime } from 'luxon';
import { Slot } from '../types';

/**
 * Type guard to check if a value is a valid Slot
 */
export function isSlot(value: any): value is Slot {
  return (
    value !== null &&
    typeof value === 'object' &&
    value.start instanceof DateTime &&
    value.end instanceof DateTime &&
    value.start <= value.end &&
    typeof value.metadata === 'object'
  );
} 