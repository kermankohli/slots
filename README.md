# @kermank/slots

A TypeScript library for handling time slots, scheduling, and timezone operations. Built with functional programming principles and timezone-aware design.

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
npm install @kermank/slots
```

## Usage

### Basic Slot Operations

```typescript
import { DateTime } from 'luxon';
import { Slot, generateSlots, intersectSlots } from '@kermank/slots';

// Generate 1-hour slots for a day
const slots = generateSlots({
  start: DateTime.fromISO('2024-01-01T09:00:00', { zone: 'America/Los_Angeles' }),
  end: DateTime.fromISO('2024-01-01T17:00:00', { zone: 'America/Los_Angeles' }),
  duration: { hours: 1 }
});

// Find overlapping slots between two sets
const overlappingSlots = intersectSlots(slots1, slots2);
```

### Applying Rules

```typescript
import { 
  removeWeekendsRule, 
  allowTimeRangeRule, 
  createBufferRule 
} from '@kermank/slots';

// Remove weekend slots
const weekdayRule = removeWeekendsRule();
const weekdaySlots = weekdayRule(slots);

// Apply working hours (9 AM - 5 PM)
const workingHours = allowTimeRangeRule(9, 17);
const workHourSlots = workingHours(slots);

// Add buffer time around slots
const bufferRule = createBufferRule(
  slot => slot.metadata.type === 'meeting',
  30, // 30 minutes before
  30  // 30 minutes after
);
```

### Timezone Operations

```typescript
import { DateTime } from 'luxon';
import { generateSlots } from '@kermank/slots';

// Generate slots in different timezones
const sydneySlots = generateSlots({
  start: DateTime.fromISO('2024-01-01T09:00:00', { zone: 'Australia/Sydney' }),
  end: DateTime.fromISO('2024-01-01T17:00:00', { zone: 'Australia/Sydney' }),
  duration: { hours: 1 }
});

const sfSlots = generateSlots({
  start: DateTime.fromISO('2024-01-01T09:00:00', { zone: 'America/Los_Angeles' }),
  end: DateTime.fromISO('2024-01-01T17:00:00', { zone: 'America/Los_Angeles' }),
  duration: { hours: 1 }
});

// Find overlapping availability across timezones
const globalAvailability = intersectSlots(sydneySlots, sfSlots);
```

## API Reference

### Types

#### Slot
```typescript
interface Slot {
  start: DateTime;  // Luxon DateTime
  end: DateTime;    // Luxon DateTime
  metadata?: any;   // Optional metadata
}
```

### Core Functions

- `generateSlots(options)`: Generate time slots with specified duration
- `intersectSlots(slots1, slots2)`: Find overlapping slots between two sets
- `removeOverlappingSlots(slots, overlapping)`: Remove overlapping slots from a set
- `addSlots(slots1, slots2)`: Combine two sets of slots
- `removeExactSlots(toRemove)(slots)`: Remove specific slots from a set

### Rules

- `removeWeekendsRule()`: Filter out weekend slots
- `allowTimeRangeRule(startHour, endHour)`: Filter slots to specific hours
- `createBufferRule(predicate, beforeMinutes, afterMinutes)`: Add buffer time around slots
- `maxSlotsPerDayRule(maxSlots)`: Limit the number of slots per day

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © Kerman Kohli 