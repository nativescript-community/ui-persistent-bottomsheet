import { describe, expect, it } from 'vitest';
import { computeSnapIndex } from '../src/ui-persistent-bottomsheet/snap';

const steps = [0, 70, 200, 800];
const noZero = (index: number) => index > 0;

describe('computeSnapIndex', () => {
    it('slow release goes to the nearest step', () => {
        expect(computeSnapIndex({ steps, position: 120, velocity: 0 })).toBe(1);
        expect(computeSnapIndex({ steps, position: 140, velocity: 50 })).toBe(2);
        expect(computeSnapIndex({ steps, position: 600, velocity: -100 })).toBe(3);
    });

    it('medium flick up from a step goes to the next step', () => {
        expect(computeSnapIndex({ steps, position: 200, velocity: 400, projection: 0.05 })).toBe(3);
        expect(computeSnapIndex({ steps, position: 70, velocity: 400, projection: 0.05 })).toBe(2);
    });

    it('medium flick down from a step goes to the previous step', () => {
        expect(computeSnapIndex({ steps, position: 800, velocity: -400, projection: 0.05 })).toBe(2);
        expect(computeSnapIndex({ steps, position: 200, velocity: -400, projection: 0.05 })).toBe(1);
    });

    it('flick released between steps goes to the next step in its direction', () => {
        // nearest step is the one behind: the flick still wins
        expect(computeSnapIndex({ steps, position: 230, velocity: 400, projection: 0.05 })).toBe(3);
        expect(computeSnapIndex({ steps, position: 770, velocity: -400, projection: 0.05 })).toBe(2);
    });

    it('flick at the last or first step stays there', () => {
        expect(computeSnapIndex({ steps, position: 800, velocity: 900 })).toBe(3);
        expect(computeSnapIndex({ steps: [70, 200], position: 70, velocity: -900 })).toBe(0);
    });

    it('hard flick skips steps', () => {
        expect(computeSnapIndex({ steps, position: 800, velocity: -4000, projection: 0.2, canSnapTo: noZero })).toBe(1);
        expect(computeSnapIndex({ steps, position: 70, velocity: 4000, projection: 0.2 })).toBe(3);
    });

    it('never picks a step that cannot be snapped to', () => {
        expect(computeSnapIndex({ steps, position: 30, velocity: 0, canSnapTo: noZero })).toBe(1);
        expect(computeSnapIndex({ steps, position: 70, velocity: -600, canSnapTo: noZero })).toBe(1);
    });

    it('below the fling velocity the flick is a slow release', () => {
        expect(computeSnapIndex({ steps, position: 230, velocity: 100, flingVelocity: 300 })).toBe(2);
    });
});
