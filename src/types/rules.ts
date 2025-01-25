import { Slot } from './slot';

/**
 * A rule is a function that takes slots and returns forbidden slots
 * The forbidden slots will be subtracted from the input slots
 */
export type SlotRule = (slots: Slot[]) => Slot[]; 