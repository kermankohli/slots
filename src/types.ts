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

/**
 * Generic operation result type
 */
export type OperationResult<T> = {
  data: T;
  error?: string;
};

/**
 * Type for any function that operates on slots
 */
export type SlotOperator<T> = (slots: Slot[]) => OperationResult<T>;

/**
 * Compose multiple slot operators into one
 */
export function composeOperators<T>(...operators: SlotOperator<T>[]): SlotOperator<T> {
  return (slots: Slot[]) => {
    for (const operator of operators) {
      const result = operator(slots);
      if (result.error) return result;
      slots = result.data as Slot[]; // Safe because we know operators return Slot[]
    }
    return { data: slots as T };
  };
}

/**
 * Available operations that can be performed on slots
 */
export type SlotOperation = 
  | { type: 'ADD'; slots: Slot | Slot[] }
  | { type: 'REMOVE'; slots: Slot | Slot[] }
  | { type: 'UPDATE'; oldSlot: Slot; newSlot: Slot };

/**
 * Result of a slot operation
 */
export interface SlotOperationResult {
  slots: Slot[];
  error?: string;
} 