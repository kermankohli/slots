/**
 * Represents a time slot with start and end times
 */
export interface Slot {
  start: Date;
  end: Date;
  metadata: Metadata;
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
export type MetadataMerger = (a: Metadata, b: Metadata) => Metadata;

/**
 * Strategy for determining if slots overlap
 */
export type OverlapStrategy = 'strict' | 'inclusive';

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
 * Default metadata merge behavior - keep last values
 */
export const defaultMetadataMerger: MetadataMerger = (meta1, meta2) => ({
  ...meta1,
  ...meta2
});

/**
 * Available metadata merge strategies
 */
export type MetadataStrategy = 'keep_first' | 'keep_last' | 'combine' | 'error' | 'custom';

/**
 * Configuration for a specific metadata key
 */
export interface MetadataKeyConfig {
  strategy: MetadataStrategy;
  merge?: (v1: any, v2: any) => any;
}

/**
 * Configuration for metadata merging
 */
export interface MetadataMergeConfig {
  defaultStrategy: MetadataStrategy;
  customMerge?: (meta1: SlotMetadata, meta2: SlotMetadata) => SlotMetadata;
  keyStrategies?: {
    [key: string]: MetadataKeyConfig;
  };
}

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
  edgeStrategy?: EdgeStrategy;  // Optional with default in implementation
}

export type Metadata = Record<string, any>;

export type EdgeStrategy = 'inclusive' | 'exclusive'; 