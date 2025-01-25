import { Slot } from '../types';
import { SlotRule } from '../types';

type SlotMatcher = (slot: Slot) => boolean;

/**
 * Creates a rule that adds buffer time before and after matching slots
 * @param matcher - Function that returns true for slots that should have buffers
 * @param bufferBefore - Minutes to block before the matching slot
 * @param bufferAfter - Minutes to block after the matching slot
 * @returns A rule that returns buffer slots that should be forbidden
 */
export const createBufferRule = (
  matcher: SlotMatcher,
  bufferBefore: number = 0,
  bufferAfter: number = 0
): SlotRule => (slots: Slot[]) => {
  // Find all matching slots
  const matchingSlots = slots.filter(matcher);
  
  // Create buffer slots for each matching slot
  const bufferSlots: Slot[] = [];
  
  matchingSlots.forEach(slot => {
    if (bufferBefore > 0) {
      bufferSlots.push({
        start: slot.start.minus({ minutes: bufferBefore }),
        end: slot.start,
        metadata: {
          ...slot.metadata,
          isBuffer: true,
          bufferType: 'before',
          originalSlot: slot
        }
      });
    }
    
    if (bufferAfter > 0) {
      bufferSlots.push({
        start: slot.end,
        end: slot.end.plus({ minutes: bufferAfter }),
        metadata: {
          ...slot.metadata,
          isBuffer: true,
          bufferType: 'after',
          originalSlot: slot
        }
      });
    }
  });
  
  return bufferSlots;
};

// Example usage:
// const flightBufferRule = createBufferRule(
//   slot => slot.metadata?.type === 'flight',
//   420, // 7 hours before
//   480  // 8 hours after
// );

// const meetingBufferRule = createBufferRule(
//   slot => slot.metadata?.type === 'meeting',
//   30,  // 30 minutes before
//   30   // 30 minutes after
// ); 