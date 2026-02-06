export interface Velocity {
    x: number;
    y: number;
}

interface Sample {
    x: number;
    y: number;
    t: number;
}

export class VelocityTracker {
    private samples: Sample[] = [];
    private vx = 0;
    private vy = 0;

    private maxAgeMs = 300;
    private maxVelocity = Infinity;

    static obtain(): VelocityTracker {
        return new VelocityTracker();
    }

    recycle(): void {
        this.samples.length = 0;
    }

    addMovement(x: number, y: number, time?: number): void {
        const t = time ?? performance.now();
        this.samples.push({ x, y, t });

        // drop old samples
        while (this.samples.length && t - this.samples[0].t > this.maxAgeMs) {
            this.samples.shift();
        }
    }

    computeCurrentVelocity(units = 1000, maxVelocity = Infinity): void {
        this.maxVelocity = maxVelocity;

        if (this.samples.length < 2) {
            this.vx = 0;
            this.vy = 0;
            return;
        }

        let sumW = 0;
        let sumVX = 0;
        let sumVY = 0;

        const newestTime = this.samples[this.samples.length - 1].t;

        for (let i = 1; i < this.samples.length; i++) {
            const a = this.samples[i - 1];
            const b = this.samples[i];

            const dt = (b.t - a.t) / 1000;
            if (dt <= 0) continue;

            const age = newestTime - b.t;
            const w = Math.max(0.1, 1 - age / this.maxAgeMs);

            sumW += w;
            sumVX += (w * (b.x - a.x)) / dt;
            sumVY += (w * (b.y - a.y)) / dt;
        }

        this.vx = this.clamp((sumVX / sumW) * (units / 1000));
        this.vy = this.clamp((sumVY / sumW) * (units / 1000));
    }

    getXVelocity(): number {
        return this.vx;
    }

    getYVelocity(): number {
        return this.vy;
    }

    private clamp(v: number): number {
        return Math.max(-this.maxVelocity, Math.min(this.maxVelocity, v));
    }
}
