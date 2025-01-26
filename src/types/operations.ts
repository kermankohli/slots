import { Slot } from './slot';
import { MetadataMerger } from './slot';
import { Duration } from 'luxon';
import { EdgeStrategy } from './slot';

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
export type SlotOperator<T> = (
  slots: Slot[], 
  metadataMerger?: MetadataMerger
) => OperationResult<T>;

/**
 * Available set operations for slots
 */
export type SlotSetOperation = 'union' | 'intersection' | 'difference' | 'symmetric_difference';

/**
 * Result of a slot operation
 */
export type SlotOperationResult = Slot[];

/**
 * Options for slot operations
 */
export interface SlotOperationOptions {
  metadataMerger: MetadataMerger;
  edgeStrategy?: EdgeStrategy;
  minDuration?: Duration; // Minimum duration for a slot to be included in the result
}

export type EdgeStrategy = 'inclusive' | 'exclusive'; 