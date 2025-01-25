import { DateTime } from 'luxon';

/**
 * Represents a time slot with start and end times
 */
export interface Slot {
  start: DateTime;
  end: DateTime;
  metadata: SlotMetadata;
}

/**
 * Simple key-value metadata structure
 */
export interface SlotMetadata {
  [key: string]: any;
}

/**
 * Function type for custom metadata merging
 */
export type MetadataMerger = (a: SlotMetadata, b: SlotMetadata) => SlotMetadata;

/**
 * Strategy for determining if slots overlap
 */
export type OverlapStrategy = 'strict' | 'inclusive';

/**
 * Default metadata merge behavior - keep last values
 */
export const defaultMetadataMerger: MetadataMerger = (meta1, meta2) => ({
  ...meta1,
  ...meta2
}); 