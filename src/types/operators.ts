import { Slot } from './slot';
import { SlotOperator } from './operations';

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