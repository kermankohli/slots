/**
 * Function type for custom metadata merging
 */
export type MetadataMerger = (a: any, b: any) => any;

/**
 * Default metadata merge behavior - keep last values
 */
export const defaultMetadataMerger: MetadataMerger = (meta1, meta2) => ({
  ...meta1,
  ...meta2
});

/**
 * Base metadata type
 */
export type Metadata = Record<string, any>;

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
  customMerge?: (meta1: any, meta2: any) => any;
  keyStrategies?: {
    [key: string]: MetadataKeyConfig;
  };
} 