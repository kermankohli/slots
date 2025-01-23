/**
 * Represents a time slot with start and end times
 */
export interface Slot {
  start: Date;
  end: Date;
  metadata: SlotMetadata;
}

/**
 * Simple key-value metadata structure
 */
export interface SlotMetadata {
  [key: string]: string | number | boolean | null;
} 