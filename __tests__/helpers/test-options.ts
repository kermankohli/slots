import { SlotOperationOptions } from '../../src/types';

export const defaultOptions: SlotOperationOptions = {
  edgeStrategy: 'exclusive',
  metadataMerger: (a, b) => ({ ...a, ...b }),
}; 