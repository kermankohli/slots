import { DateTime, Duration } from 'luxon';
import { 
  intersectSlots, 
  unionSlots, 
  removeOverlappingSlots,
  symmetricDifferenceSlots,
  applySetOperation 
} from '../src/utils/slot-set-operations';
import { Slot, MetadataMerger } from '../src/types';
import { mergeSlots } from '../src';
import { createSlotFromHourOffset } from './helpers/slot-test-helpers';

describe('Slot Set Operations', () => {
  const baseDate = DateTime.fromISO('2024-01-01T10:00:00.000Z');

  const createDate = (hours: number) => baseDate.plus({ hours });

  const keepSecondMetadata: MetadataMerger = (_, meta2) => meta2;

  describe('Edge Behavior', () => {
    describe('inclusive edges (default)', () => {
      it('should merge slots that touch at edges', () => {
        const slotA: Slot = {
          start: createDate(0),
          end: createDate(2),
          metadata: { owner: 'alice' }
        };
        const slotB: Slot = {
          start: createDate(2),
          end: createDate(4),
          metadata: { owner: 'bob' }
        };

        const result = mergeSlots(slotA, slotB, keepSecondMetadata);

        expect(result).toEqual({
          start: createDate(0),
          end: createDate(4),
          metadata: { owner: 'bob' }
        });
      });

      it('should consider point of contact as intersection', () => {
        const slotA: Slot = {
          start: createDate(0),
          end: createDate(2),
          metadata: { owner: 'alice' }
        };
        const slotB: Slot = {
          start: createDate(2),
          end: createDate(4),
          metadata: { owner: 'bob' }
        };

        const result = intersectSlots(slotA, slotB, { 
          metadataMerger: keepSecondMetadata,
          edgeStrategy: 'inclusive'
        });
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          start: createDate(2),
          end: createDate(2),
          metadata: { owner: 'bob' }
        });
      });
    });

    describe('exclusive edges', () => {
      it('should keep slots separate that only touch', () => {
        const slotA: Slot = {
          start: createDate(0),
          end: createDate(2),
          metadata: { owner: 'alice' }
        };
        const slotB: Slot = {
          start: createDate(2),
          end: createDate(4),
          metadata: { owner: 'bob' }
        };

        const result = unionSlots(slotA, slotB, { 
          metadataMerger: keepSecondMetadata,
          edgeStrategy: 'exclusive'
        });
        expect(result).toHaveLength(2);
        expect(result).toEqual([
          {
            start: createDate(0),
            end: createDate(2),
            metadata: { owner: 'alice' }
          },
          {
            start: createDate(2),
            end: createDate(4),
            metadata: { owner: 'bob' }
          }
        ]);
      });

      it('should consider point of contact as empty intersection', () => {
        const slotA: Slot = {
          start: createDate(0),
          end: createDate(2),
          metadata: { owner: 'alice' }
        };
        const slotB: Slot = {
          start: createDate(2),
          end: createDate(4),
          metadata: { owner: 'bob' }
        };

        const result = intersectSlots(slotA, slotB, { 
          metadataMerger: keepSecondMetadata,
          edgeStrategy: 'exclusive'
        });
        expect(result).toHaveLength(0);
      });

      it('should preserve edge points in difference', () => {
        const slotA: Slot = {
          start: createDate(0),
          end: createDate(2),
          metadata: { owner: 'alice' }
        };

        const slotB: Slot = {
          start: createDate(2),
          end: createDate(4),
          metadata: { owner: 'bob' }
        };

        const result = unionSlots(slotA, slotB, { 
          metadataMerger: keepSecondMetadata,
          edgeStrategy: 'exclusive'
        });

        expect(result).toHaveLength(2);
        expect(result).toEqual([
          {
            start: createDate(0),
            end: createDate(2),
            metadata: { owner: 'alice' }
          },
          {
            start: createDate(2),
            end: createDate(4),
            metadata: { owner: 'bob' }
          }
        ]);
      });
    });

    it('should handle zero-duration slots', () => {
      const slotA = createSlotFromHourOffset(2, 2, { owner: 'alice' });
      const slotB = createSlotFromHourOffset(2, 4, { owner: 'bob' });

      const result = intersectSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...createSlotFromHourOffset(2, 2),
        metadata: { owner: 'bob' }
      });
    });

    it('should handle slots that touch at edges', () => {
      const slotA = createSlotFromHourOffset(1, 2, { owner: 'alice' });
      const slotB = createSlotFromHourOffset(2, 3, { owner: 'bob' });

      // With strict overlap
      const strictResult = intersectSlots(slotA, slotB, {
        metadataMerger: keepSecondMetadata,
        edgeStrategy: 'exclusive'
      });
      expect(strictResult).toHaveLength(0);

      // With inclusive overlap
      const inclusiveResult = intersectSlots(slotA, slotB, {
        metadataMerger: keepSecondMetadata,
        edgeStrategy: 'inclusive'
      });
      expect(inclusiveResult).toHaveLength(1);
      expect(inclusiveResult[0]).toEqual({
        ...createSlotFromHourOffset(2, 2),
        metadata: { owner: 'bob' }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero-duration slots at edges', () => {
      const slotA = createSlotFromHourOffset(2, 2, { owner: 'alice' });
      const slotB = createSlotFromHourOffset(2, 4, { owner: 'bob' });
     
      // Union should include zero-duration slot
      const unionResult = unionSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(unionResult).toHaveLength(1);
      expect(unionResult[0]).toEqual({
        ...createSlotFromHourOffset(2, 4),
        metadata: { owner: 'bob' }
      });

      // Intersection should be the zero-duration point
      const intersectionResult = intersectSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(intersectionResult).toHaveLength(1);
      expect(intersectionResult[0]).toEqual({
        ...createSlotFromHourOffset(2, 2),
        metadata: { owner: 'bob' }
      });
    });
  });

  describe('intersectSlots', () => {
    it('should return empty array for non-overlapping slots', () => {
      const slotA = createSlotFromHourOffset(0, 2, { owner: 'alice' });
      const slotB = createSlotFromHourOffset(3, 5, { owner: 'bob' });

      const result = intersectSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toHaveLength(0);
    });

    it('should return overlapping portion with merged metadata', () => {
      const slotA = createSlotFromHourOffset(0, 3, { owner: 'alice' });
      const slotB = createSlotFromHourOffset(2, 5, { owner: 'bob' });

      const result = intersectSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...createSlotFromHourOffset(2, 3),
        metadata: { owner: 'bob' }
      });
    });

    it('should filter out intersections smaller than minDuration', () => {
      const slotA = createSlotFromHourOffset(0, 2, { owner: 'alice' });
      const slotB = createSlotFromHourOffset(1.5, 4, { owner: 'bob' });

      const result = intersectSlots(slotA, slotB, { 
        metadataMerger: keepSecondMetadata,
        minDuration: Duration.fromObject({ hours: 1 })
      });
      expect(result).toHaveLength(0); // 30 min intersection is filtered out
    });

    it('should keep intersections larger than minDuration', () => {
      const slotA = createSlotFromHourOffset(0, 3, { owner: 'alice' });
      const slotB = createSlotFromHourOffset(1, 4, { owner: 'bob' });

      const result = intersectSlots(slotA, slotB, { 
        metadataMerger: keepSecondMetadata,
        minDuration: Duration.fromObject({ hours: 1 })
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...createSlotFromHourOffset(1, 3),
        metadata: { owner: 'bob' }
      });
    });
  });

  describe('unionSlots', () => {
    it('should return both slots if no overlap', () => {
      const slotA = createSlotFromHourOffset(0, 2, { owner: 'alice' });
      const slotB = createSlotFromHourOffset(3, 5, { owner: 'bob' });

      const result = unionSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(slotA);
      expect(result[1]).toEqual(slotB);
    });

    it('should merge overlapping slots', () => {
      const slotA = createSlotFromHourOffset(0, 3, { owner: 'alice' });
      const slotB = createSlotFromHourOffset(2, 5, { owner: 'bob' });

      const result = unionSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...createSlotFromHourOffset(0, 5),
        metadata: { owner: 'bob' }
      });
    });
  });

  describe('removeOverlappingSlots', () => {
    it('should return first slot if no overlap', () => {
      const slotA = createSlotFromHourOffset(0, 2, { owner: 'alice' });
      const slotB = createSlotFromHourOffset(3, 5, { owner: 'bob' });

      const result = removeOverlappingSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(slotA);
    });

    it('should return non-overlapping parts of first slot', () => {
      const slotA = createSlotFromHourOffset(0, 4, { owner: 'alice' });
      const slotB = createSlotFromHourOffset(2, 3, { owner: 'bob' });

      const result = removeOverlappingSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ...createSlotFromHourOffset(0, 2),
        metadata: { owner: 'alice' }
      });
      expect(result[1]).toEqual({
        ...createSlotFromHourOffset(3, 4),
        metadata: { owner: 'alice' }
      });
    });

    it('should filter out parts smaller than minDuration', () => {
      const slotA = createSlotFromHourOffset(0, 4, { owner: 'alice' });
      const slotB = createSlotFromHourOffset(1.5, 2.5, { owner: 'bob' });

      const result = removeOverlappingSlots(slotA, slotB, { 
        metadataMerger: keepSecondMetadata,
        minDuration: Duration.fromObject({ hours: 2 })
      });
      expect(result).toHaveLength(0);
    });

    it('should keep parts larger than minDuration and filter out smaller parts', () => {
      const slotA = createSlotFromHourOffset(0, 6, { owner: 'alice' });
      const slotB = createSlotFromHourOffset(1, 2, { owner: 'bob' });

      const result = removeOverlappingSlots(slotA, slotB, { 
        metadataMerger: keepSecondMetadata,
        minDuration: Duration.fromObject({ hours: 2 })
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...createSlotFromHourOffset(2, 6),
        metadata: { owner: 'alice' }
      });
    });
  });

  describe('symmetricDifferenceSlots', () => {
    it('should return both slots if no overlap', () => {
      const slotA = createSlotFromHourOffset(0, 2, { owner: 'alice' });
      const slotB = createSlotFromHourOffset(3, 5, { owner: 'bob' });

      const result = symmetricDifferenceSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(slotA);
      expect(result[1]).toEqual(slotB);
    });

    it('should return non-overlapping parts of both slots', () => {
      const slotA = createSlotFromHourOffset(0, 4, { owner: 'alice' });
      const slotB = createSlotFromHourOffset(2, 5, { owner: 'bob' });

      const result = symmetricDifferenceSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ...createSlotFromHourOffset(0, 2),
        metadata: { owner: 'alice' }
      });
      expect(result[1]).toEqual({
        ...createSlotFromHourOffset(4, 5),
        metadata: { owner: 'bob' }
      });
    });
  });

  describe('applySetOperation', () => {
    const slotA: Slot = {
      start: createDate(0),
      end: createDate(3),
      metadata: { owner: 'alice' }
    };
    const slotB: Slot = {
      start: createDate(2),
      end: createDate(5),
      metadata: { owner: 'bob' }
    };

    it('should apply union operation', () => {
      const result = applySetOperation('union', slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toEqual(unionSlots(slotA, slotB, { metadataMerger: keepSecondMetadata }));
    });

    it('should apply intersection operation', () => {
      const result = applySetOperation('intersection', slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toEqual(intersectSlots(slotA, slotB, { metadataMerger: keepSecondMetadata }));
    });

    it('should apply difference operation', () => {
      const result = applySetOperation('difference', slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toEqual(removeOverlappingSlots(slotA, slotB, { metadataMerger: keepSecondMetadata }));
    });

    it('should apply symmetric difference operation', () => {
      const result = applySetOperation('symmetric_difference', slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toEqual(symmetricDifferenceSlots(slotA, slotB, { metadataMerger: keepSecondMetadata }));
    });
  });
}); 