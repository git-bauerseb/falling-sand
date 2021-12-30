const offscreenParticleCanvas = document.createElement('canvas');
const offscreenParticleCtx = offscreenParticleCanvas.getContext('2d', {alpha: false});

const UNKNOWN_PARTICLE_INIT = 0;
const METHANE_PARTICLE_INIT = 7;

const __particleInit = [
    UNKNOWN_PARTICLE_INIT,
    METHANE_PARTICLE_INIT
];

Object.freeze(__particleInit);

const _particleActions = [
    UNKNOWN_PARTICLE_ACTION,
    METHANE_PARTICLE_ACTION
];

Object.freeze(_particleActions);


/*
 * When we copy the particle strokes to the main canvas, some
 * of the colors will not match any elements (due to anti-aliasing
 * of the stroke). We need a fast way to know if a given color is
 * a valid color for painting. Hence, this dictionary of colors that can
 * be copied from the particle canvas to the main canvas.
 */
const PAINTABLE_PARTICLE_COLORS = {};
const MAGIC_COLORS = [];


function UNKNOWN_PARTICLE_ACTION() {
    throw "Unknown particle";
}

function METHANE_PARTICLE_ACTION() { }

class ParticleList {
    constructor() {
        this.activeHead = null;
        this.activeSize = 0;
        this.inactiveHead = null;
        this.inactiveSize = 0;
        this.particleCounts = new Uint32Array(__particleInit.length);

        /* This probably isn't necessary, but I don't trust javascript */
        for (var i = 0; i < this.particleCounts.length; i++) {
            this.particleCounts[i] = 0;
        }
    }

    addActiveParticle(type, x, y, i) {
        if (this.inactiveSize === 0) return null;

        const particle = this.inactiveHead;
        this.inactiveHead = this.inactiveHead.next;
        if (this.inactiveHead) this.inactiveHead.prev = null;
        this.inactiveSize--;

        if (!this.activeHead) {
            particle.next = null;
            particle.prev = null;
            this.activeHead = particle;
        } else {
            this.activeHead.prev = particle;
            particle.next = this.activeHead;
            particle.prev = null;
            this.activeHead = particle;
        }
        this.activeSize++;

        particle.active = true;
        particle.reinitialized = false;
        particle.actionIterations = 0;
        particle.type = type;
        particle.initX = x;
        particle.initY = y;
        particle.x = x;
        particle.y = y;
        particle.i = i;
        this.particleCounts[type]++;
        __particleInit[type](particle);

        return particle;
    }

    makeParticleInactive(particle) {
        particle.active = false;
        this.particleCounts[particle.type]--;
        particle.type = UNKNOWN_PARTICLE;
        if (particle.prev) {
            particle.prev.next = particle.next;
        }
        if (particle.next) {
            particle.next.prev = particle.prev;
        }
        if (particle === this.activeHead) {
            this.activeHead = particle.next;
        }
        this.activeSize--;

        if (!this.inactiveHead) {
            particle.next = null;
            particle.prev = null;
            this.inactiveHead = particle;
        } else {
            this.inactiveHead.prev = particle;
            particle.next = this.inactiveHead;
            particle.prev = null;
            this.inactiveHead = particle;
        }
        this.inactiveSize++;
    }

    inactivateAll() {
        var particle = this.activeHead;
        while (particle) {
            const next = particle.next;
            this.makeParticleInactive(particle);
            particle = next;
        }
    }

    reinitializeParticle(particle, newType) {
        if (!particle.active) throw "Can only be used with active particles";

        this.particleCounts[particle.type]--;
        this.particleCounts[newType]++;
        particle.type = newType;
        particle.reinitialized = true;
        __particleInit[newType](particle);
    }

    particleActive(particleType) {
        return this.particleCounts[particleType] > 0;
    }
}

class Particle {
    constructor() {
        this.type = UNKNOWN_PARTICLE;
        this.initX = -1;
        this.initY = -1;
        this.x = -1;
        this.y = -1;
        this.i = -1;
        this.color = 0;
        this.rgbaColor = "rgba(0, 0, 0, 1)";
        this.velocity = 0;
        this.angle = 0;
        this.xVelocity = 0;
        this.yVelocity = 0;
        this.size = 0;
        this.actionIterations = 0;
        this.active = false;
        this.next = null;
        this.prev = null;
        this.reinitialized = false;
    }

    setColor(hexColor) {
        if (!Particle.warned_unpaintable_color) {
            if (!(hexColor in PAINTABLE_PARTICLE_COLORS)) {
                console.log("Unpaintable particle color: " + hexColor);
                Particle.warned_unpaintable_color = true;
            }
        }

        this.color = hexColor;

        const r = hexColor & 0xff;
        const g = (hexColor & 0xff00) >>> 8;
        const b = (hexColor & 0xff0000) >>> 16;
        this.rgbaColor = "rgba(" + r + "," + g + "," + b + ", 1)";
    }

    setRandomColor(whitelist) {
        const colorIdx = Math.floor(Math.random() * whitelist.length);
        this.setColor(whitelist[colorIdx]);
    }

    offCanvas() {
        const x = this.x;
        const y = this.y;
        return x < 0 || x > MAX_X_IDX || y < 0 || y > MAX_Y_IDX;
    }

    setVelocity(velocity, angle) {
        this.velocity = velocity;
        this.angle = angle;
        this.xVelocity = velocity * Math.cos(angle);
        this.yVelocity = velocity * Math.sin(angle);
    }

    /*
     * For a spherical particle on a trajectory, figure out what element the
     * particle is about to hit (right at its tip).
     *
     * Expects caller has updated particle's x and y velocity.
     */
    aboutToHit() {
        const radius = this.size / 2;
        const theta = Math.atan2(this.yVelocity, this.xVelocity);
        const xPrime = this.x + Math.cos(theta) * radius;
        const yPrime = this.y + Math.sin(theta) * radius;
        const idx = Math.round(xPrime) + Math.round(yPrime) * width;

        if (idx < 0 || idx > MAX_IDX) return BACKGROUND;

        return gameImagedata32[idx];
    }

    drawCircle(radius) {
        offscreenParticleCtx.beginPath();
        offscreenParticleCtx.lineWidth = 0;
        offscreenParticleCtx.fillStyle = this.rgbaColor;
        offscreenParticleCtx.arc(this.x, this.y, radius, 0, TWO_PI);
        offscreenParticleCtx.fill();
    }
}


const particles = new ParticleList();


function initParticles() {
    if (__particleInit.length !== _particleActions.length) {
        throw "Particle arrays must be same length";
    }

    let numParticlesToCreate = MAX_NUM_PARTICLES;
    let prevParticle;

    particles.inactiveHead = new Particle();
    particles.inactiveSize++;
    prevParticle = particles.inactiveHead;
    numParticlesToCreate--;

    while (numParticlesToCreate > 0) {
        const particle = new Particle();
        particle.prev = prevParticle;
        prevParticle.next = particle;
        prevParticle = particle;

        numParticlesToCreate--;
    }

    offscreenParticleCanvas.width = canvWidth;
    offscreenParticleCanvas.height = canvHeight;

    PAINTABLE_PARTICLE_COLORS[FIRE] = null;


    Object.freeze(PAINTABLE_PARTICLE_COLORS);

    // MAGIC_COLORS.push();
    Object.freeze(MAGIC_COLORS);
}