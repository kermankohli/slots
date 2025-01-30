import { DateTime } from 'luxon';

/**
 * Represents a time slot with start and end times
 */
export interface Slot {
  start: DateTime;
  end: DateTime;
  metadata: any;
}

/**
 * Strategy for determining if slots overlap
 */
export type OverlapStrategy = 'strict' | 'inclusive';
