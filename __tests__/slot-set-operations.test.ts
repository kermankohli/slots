import { 
  intersectSlots, 
  unionSlots, 
  differenceSlots, 
  symmetricDifferenceSlots,
  applySetOperation 
} from '../src/utils/slot-set-operations';
import { Slot, MetadataMerger } from '../src/types';

describe('Slot Set Operations', () => {
  // Helper to create dates relative to a base time
  const baseTime = new Date('2024-01-01T00:00:00Z');
  const createDate = (offsetHours: number) => new Date(baseTime.getTime() + offsetHours * 3600000);

  // Test metadata merger that keeps the second slot's metadata
  const keepSecondMetadata: MetadataMerger = (a, b) => b;

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

        const result = unionSlots(slotA, slotB, { 
          metadataMerger: keepSecondMetadata,
          edgeStrategy: 'inclusive'
        });
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
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

        const result = differenceSlots(slotA, slotB, { 
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
            end: createDate(2),
            metadata: { owner: 'alice' }
          }
        ]);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero-duration slots at edges', () => {
      const slotA: Slot = {
        start: createDate(2),
        end: createDate(2), // Zero duration
        metadata: { owner: 'alice' }
      };
      const slotB: Slot = {
        start: createDate(2),
        end: createDate(4),
        metadata: { owner: 'bob' }
      };

      // Union should include zero-duration slot
      const unionResult = unionSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(unionResult).toHaveLength(1);
      expect(unionResult[0]).toEqual({
        start: createDate(2),
        end: createDate(4),
        metadata: { owner: 'bob' }
      });

      // Intersection should be the zero-duration point
      const intersectionResult = intersectSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(intersectionResult).toHaveLength(1);
      expect(intersectionResult[0]).toEqual({
        start: createDate(2),
        end: createDate(2),
        metadata: { owner: 'bob' }
      });
    });
  });

  describe('intersectSlots', () => {
    it('should return empty for non-overlapping slots', () => {
      const slotA: Slot = {
        start: createDate(0),
        end: createDate(2),
        metadata: { owner: 'alice' }
      };
      const slotB: Slot = {
        start: createDate(3),
        end: createDate(5),
        metadata: { owner: 'bob' }
      };

      const result = intersectSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toHaveLength(0);
    });

    it('should return intersection with merged metadata', () => {
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

      const result = intersectSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        start: createDate(2),
        end: createDate(3),
        metadata: { owner: 'bob' }
      });
    });
  });

  describe('unionSlots', () => {
    it('should return both slots for non-overlapping slots', () => {
      const slotA: Slot = {
        start: createDate(0),
        end: createDate(2),
        metadata: { owner: 'alice' }
      };
      const slotB: Slot = {
        start: createDate(3),
        end: createDate(5),
        metadata: { owner: 'bob' }
      };

      const result = unionSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(slotA);
      expect(result[1]).toEqual(slotB);
    });

    it('should merge overlapping slots with metadata', () => {
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

      const result = unionSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        start: createDate(0),
        end: createDate(5),
        metadata: { owner: 'bob' }
      });
    });
  });

  describe('differenceSlots', () => {
    it('should return original slot if no overlap', () => {
      const slotA: Slot = {
        start: createDate(0),
        end: createDate(2),
        metadata: { owner: 'alice' }
      };
      const slotB: Slot = {
        start: createDate(3),
        end: createDate(5),
        metadata: { owner: 'bob' }
      };

      const result = differenceSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(slotA);
    });

    it('should return remaining parts of first slot', () => {
      const slotA: Slot = {
        start: createDate(0),
        end: createDate(5),
        metadata: { owner: 'alice' }
      };
      const slotB: Slot = {
        start: createDate(2),
        end: createDate(3),
        metadata: { owner: 'bob' }
      };

      const result = differenceSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        start: createDate(0),
        end: createDate(2),
        metadata: { owner: 'alice' }
      });
      expect(result[1]).toEqual({
        start: createDate(3),
        end: createDate(5),
        metadata: { owner: 'alice' }
      });
    });
  });

  describe('symmetricDifferenceSlots', () => {
    it('should return both slots if no overlap', () => {
      const slotA: Slot = {
        start: createDate(0),
        end: createDate(2),
        metadata: { owner: 'alice' }
      };
      const slotB: Slot = {
        start: createDate(3),
        end: createDate(5),
        metadata: { owner: 'bob' }
      };

      const result = symmetricDifferenceSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(slotA);
      expect(result[1]).toEqual(slotB);
    });

    it('should return non-overlapping parts of both slots', () => {
      const slotA: Slot = {
        start: createDate(0),
        end: createDate(4),
        metadata: { owner: 'alice' }
      };
      const slotB: Slot = {
        start: createDate(2),
        end: createDate(5),
        metadata: { owner: 'bob' }
      };

      const result = symmetricDifferenceSlots(slotA, slotB, { metadataMerger: keepSecondMetadata });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        start: createDate(0),
        end: createDate(2),
        metadata: { owner: 'alice' }
      });
      expect(result[1]).toEqual({
        start: createDate(4),
        end: createDate(5),
        metadata: { owner: 'bob' }
      });
    });
  });

  describe('applySetOperation', () => {
    it('should apply the correct operation', () => {
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

      const options = { metadataMerger: keepSecondMetadata };

      // Test each operation
      const unionResult = applySetOperation('union', slotA, slotB, options);
      expect(unionResult).toHaveLength(1);

      const intersectionResult = applySetOperation('intersection', slotA, slotB, options);
      expect(intersectionResult).toHaveLength(1);

      const differenceResult = applySetOperation('difference', slotA, slotB, options);
      expect(differenceResult).toHaveLength(1);

      const symmetricDiffResult = applySetOperation('symmetric_difference', slotA, slotB, options);
      expect(symmetricDiffResult).toHaveLength(2);
    });
  });
}); 