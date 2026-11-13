export interface SnapOptions {
    /** the height (dp) of the sheet at each step */
    steps: number[];
    /** a step the sheet cannot rest on is skipped */
    canSnapTo?: (index: number) => boolean;
    /** where the finger released the sheet (dp) */
    position: number;
    /** dp/s, positive when the sheet goes up */
    velocity: number;
    /** above it the release is a fling: the sheet goes to the next step in the direction of the fling */
    flingVelocity?: number;
    /** seconds of velocity added to the position, a hard fling can skip steps */
    projection?: number;
}

export const DEFAULT_FLING_VELOCITY = 300;
const ON_STEP_TOLERANCE = 1;

/** Like the material and iOS sheets: a fling goes to the next step in its direction, a slow release to the nearest step. */
export function computeSnapIndex({ canSnapTo, flingVelocity = DEFAULT_FLING_VELOCITY, position, projection = 0, steps, velocity }: SnapOptions) {
    const allowed = steps.map((_step, index) => index).filter((index) => !canSnapTo || canSnapTo(index));
    if (allowed.length === 0) {
        return 0;
    }
    // on a tie the higher step wins
    const nearestTo = (point: number) => allowed.reduce((best, index) => (Math.abs(steps[index] - point) <= Math.abs(steps[best] - point) ? index : best));
    const nearest = nearestTo(position);
    if (Math.abs(velocity) < flingVelocity) {
        return nearest;
    }
    const goingUp = velocity > 0;
    const beyond = allowed.filter((index) => (goingUp ? steps[index] > position + ON_STEP_TOLERANCE : steps[index] < position - ON_STEP_TOLERANCE));
    if (beyond.length === 0) {
        return nearest;
    }
    const next = beyond.reduce((best, index) => (Math.abs(steps[index] - position) < Math.abs(steps[best] - position) ? index : best));
    const projected = nearestTo(position + velocity * projection);
    const projectedIsFurther = goingUp ? steps[projected] > steps[next] : steps[projected] < steps[next];
    return projectedIsFurther ? projected : next;
}
