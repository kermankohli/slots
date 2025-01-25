# Slots

A robust TypeScript library for managing time slots with powerful set operations, overlap detection, and timezone support.

## Features

- 🕒 **Time Slot Management**: Create, merge, and manipulate time slots
- 🔄 **Set Operations**: Union, intersection, difference, and symmetric difference
- ⚡ **Performance**: Optimized algorithms for slot operations
- 🌍 **Timezone Support**: Built on Luxon for reliable timezone handling
- 🔍 **Overlap Detection**: Flexible strategies for handling slot overlaps
- 🎯 **Type Safety**: Written in TypeScript with full type coverage
- 🧪 **Well Tested**: Comprehensive test suite

## Installation

```bash
npm install @your-org/slots
```

## Quick Start

```typescript
import { DateTime, Duration } from 'luxon';
import { generateSlots, mergeOverlappingSlots } from '@your-org/slots';

// Generate 1-hour slots with 30-minute overlap
const slots = generateSlots(
  DateTime.fromISO('2024-01-01T09:00:00Z'),
  DateTime.fromISO('2024-01-01T12:00:00Z'),
  Duration.fromObject({ hours: 1 }),
  Duration.fromObject({ minutes: 30 }),
  { type: 'meeting' }
);

// Merge overlapping slots
const mergedSlots = mergeOverlappingSlots(slots);
```

## Core Concepts

### Slots

A slot represents a time period with metadata:

```typescript
interface Slot {
  start: DateTime;  // Luxon DateTime
  end: DateTime;    // Luxon DateTime
  metadata: Record<string, any>;
}
```

### Set Operations

```typescript
import { unionSlots, intersectSlots, differenceSlots } from '@your-org/slots';

// Union: Combine slots and merge overlaps
const union = unionSlots(slotA, slotB, {
  metadataMerger: (a, b) => ({ ...a, ...b })
});

// Intersection: Find overlapping portions
const intersection = intersectSlots(slotA, slotB, {
  metadataMerger: (a, b) => ({ ...a, ...b })
});

// Difference: Remove overlapping portions
const difference = differenceSlots(slotA, slotB, {
  metadataMerger: (a, b) => ({ ...a, ...b })
});
```

### Overlap Strategies

```typescript
// Strict: Slots must actually overlap
mergeOverlappingSlots(slots, defaultMetadataMerger, 'strict');

// Inclusive: Touching slots are considered overlapping
mergeOverlappingSlots(slots, defaultMetadataMerger, 'inclusive');
```

### Timezone Handling

All times are stored and manipulated in UTC. The library uses Luxon's DateTime for reliable timezone support:

```typescript
// Create slots in different timezones
const localSlot = {
  start: DateTime.fromObject({ hour: 9 }, { zone: 'America/New_York' }).toUTC(),
  end: DateTime.fromObject({ hour: 17 }, { zone: 'America/New_York' }).toUTC(),
  metadata: { type: 'working-hours' }
};
```

## Advanced Usage

### Custom Metadata Merging

```typescript
const customMerger = (meta1: any, meta2: any) => ({
  values: [...(meta1.values || []), ...(meta2.values || [])]
});

const merged = mergeSlots(slot1, slot2, customMerger);
```

### Slot Operations

```typescript
import { addSlots, removeSlots, updateSlot } from '@your-org/slots';

// Add slots (automatically merges overlaps)
const withNewSlots = addSlots(newSlots)(existingSlots);

// Remove slots
const withoutSlots = removeSlots(slotsToRemove)(existingSlots);

// Update a slot
const updated = updateSlot(oldSlot, newSlot)(existingSlots);
```

### Operation Composition

```typescript
import { composeOperators } from '@your-org/slots';

const operation = composeOperators(
  addSlots(newSlot),
  removeSlots(oldSlot)
);

const result = operation(slots);
```

## API Documentation

[Link to detailed API documentation]

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Your Organization] 