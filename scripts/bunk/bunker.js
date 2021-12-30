const DEG_2_RAD = Math.PI / 180;
const GRAVITY = { x: 0, y: 0.002 };

// Bunker sprites
const bunkerBodyImg = document.getElementById('bunker-body-img');

// Red
const bunkerHead = document.getElementById('bunker-head');
const bunkerHeadRedLittle = document.getElementById('bunker-head-little-damage');
const bunkerHeadRedHuge = document.getElementById('bunker-head-large-damage');

const bunkerHealthBar = document.getElementById('bunker-health-bar');

const PROJECTILE_TYPE = {
    STONE       : 0,
    ACID        : 1,
    LASER       : 2,
    GRENADE     : 3,
    NUKE        : 4,
    PACKAGE     : 5
};

const PLAYER_TYPE = {
    FIRST: 0,
    SECOND: 1
};

const LeftMove = {
    0: 'a',
    1: 'ArrowLeft'
};

const RightMove = {
    0: 'd',
    1: 'ArrowRight'
};

const FireMove = {
    0: 'f',
    1: 'Enter'
};

/*
 * Move to previous weapon. 
 */
const WeaponUp = {
    0: 'w',
    1: 'ArrowUp'
};

/*
 * Move to next weapon. As the weapon list is cyclic,
 * at the end of the list the weapon is switched back.
 */
const WeaponDown = {
    0: 's',
    1: 'ArrowDown'
};


// List of all bunkers available on the playground.
let bunkers = [];

// Currently active projectiles are stored in this list.
let projectiles = [];

class Projectile {

    /*
        sX:             The start x position
        sY:             The start y position
        eX:             The end x position at end of first frame
        eY:             The end y position at end of first frame

        strength:       The strength with which a projectile is fired
        type:           The type of the projectile
        i:              The index of the projectile in the global projectile array.
                        Used for deleting the projectile from array in order to stop updating
                        it and make it available for garbage collection.
        parentI:        Index of the parent projectile. Used to avoid collision.

        Velocity is calculated based on start and end position.
        Velocity vector is the difference from start to end position times constant.
    */
    constructor(sX, sY, eX, eY, strength, type, i, ischild) {
        this.position = { x: eX, y: eY };
        this.velocity = { x: eX - sX, y: eY - sY };

        this.type = type;
        this.index = i;
        this.ischild = ischild;

        this.calculateStrength(strength);

        this.deactivated = false;
        this.updated = false;
    }

    calculateStrength(strength) {

        // The length of the initial velocity vector
        const velMag = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);

        // Numbers were determined by experimentation
        let factor = 8 / strength;

        // Set minimum value in order to prevent collision with firing bunker
        if (factor < 8) {
            factor = 8;
        }

        this.velocity.x /= 8 / 10 * factor * velMag;
        this.velocity.y /= factor * velMag;
    }

    draw(ctx) {
        if (!this.deactivated) {
            switch (this.type) {
                case PROJECTILE_TYPE.ACID:
                    ctx.fillStyle = 'rgb(157, 240, 40)';
                    break;
                case PROJECTILE_TYPE.STONE:
                    ctx.fillStyle = 'rgb(255, 87, 34)';
                    break;
                case PROJECTILE_TYPE.GRENADE:
                    ctx.fillStyle = 'rgb(0,0,255)';
                    break;
                case PROJECTILE_TYPE.NUKE:
                    ctx.fillStyle = 'rgb(253, 216, 53)';
                    break;
                case PROJECTILE_TYPE.PACKAGE:
                    ctx.fillStyle = 'brown';
            }

            if (this.position.y > 0) {
                if (this.type == PROJECTILE_TYPE.NUKE) {
                    ctx.arc(this.position.x, this.position.y, 6, 0, 2 * Math.PI);
                } else if (this.ischild) {
                    ctx.arc(this.position.x, this.position.y, 3, 0, 2 * Math.PI);
                } else {
                    ctx.arc(this.position.x, this.position.y, 5, 0, 2 * Math.PI);
                }
            } else {
                if (this.ischild) {
                    ctx.fillRect(this.position.x - 5, 0, 16, 2);
                } else {
                    ctx.fillRect(this.position.x - 10, 0, 20, 3);
                }
            }

            ctx.fill();
        }
    }

    checkCollisionForBunker(x, y, b) {
        const dx = x - b.position.x;
        const dy = y - (b.position.y - 25);

        return dx * dx + dy * dy <= 100;
    }

    update(delta, imgData) {
        this.updated = true;
        // Update for laser
        if (this.type == PROJECTILE_TYPE.LASER && !this.deactivated) {

            const endX = Math.round(this.position.x + 10000 * this.velocity.x);
            const endY = Math.round(this.position.y + 10000 * this.velocity.y);


            fillLine(this.position.x, this.position.y, endX, endY, BACKGROUND);
            fillDirtyLine(this.position.x, this.position.y+1, endX, endY+1, BACKGROUND, FIRE);
            fillLine(this.position.x, this.position.y+2, endX, endY+2, DIRT_PARTICLE);


            this.deactivated = true;
            return;
        }


        const newX = this.position.x + delta * this.velocity.x;
        const newY = this.position.y + delta * this.velocity.y + delta * GRAVITY.y;


            // Spawn two smaller grenades and delete current one
        if (this.type === PROJECTILE_TYPE.GRENADE && !this.deactivated) {
            if (random() < 5 && !this.ischild) {

                for (let i = 0; i < 5; i++) {
                    let proj = new Projectile(
                        0,0,
                        0,0,0,this.type,projectiles.length - 1, true
                    );

                    proj.position.x = this.position.x;
                    proj.position.y = this.position.y;
                    proj.velocity.x = (1 + random() / 250)*this.velocity.x;
                    proj.velocity.y = (1 + random() / 250)*this.velocity.y;

                    projectiles.push(proj);
                }

                this.deactivated = true;
                return;
            }
        }

        if (this.type === PROJECTILE_TYPE.PACKAGE && !this.deactivated) {
            if (random() < 2 && !this.ischild) {
                const _types = [PROJECTILE_TYPE.ACID,PROJECTILE_TYPE.ACID, PROJECTILE_TYPE.STONE, PROJECTILE_TYPE.NUKE, PROJECTILE_TYPE.GRENADE];
                for (let i = 0; i < 5; i++) {

                    let proj = new Projectile(
                        0,0,
                        0,0,0,_types[i],projectiles.length - 1, true
                    );

                    proj.position.x = this.position.x;
                    proj.position.y = this.position.y;
                    proj.velocity.x = (1 + random() / 100)*this.velocity.x;
                    proj.velocity.y = (1 + random() / 100)*this.velocity.y;

                    projectiles.push(proj);
                }

                this.deactivated = true;
                return;
            }
        }

        this.position.x = newX;
        this.position.y = newY;
        this.velocity.y += delta * GRAVITY.y / 100;

        if (this.position.y > canvHeight || this.position.x < 0 || this.position.x > canvWidth) {
            this.deactivated = true;
        }

        // Check for collision with elements
        const intX = Math.floor(this.position.x);
        const intY = Math.floor(this.position.y);

        if (!this.deactivated && affectedByProjectile.includes(imgData[intX + canvWidth * intY])) {
            // Destruction depends on type
            switch (this.type) {
                case PROJECTILE_TYPE.STONE:
                    fillCircle(intX, intY, 15, METHANE);
                    break;
                case PROJECTILE_TYPE.ACID:
                    fillCircle(intX, intY, 8, ACID);
                    break;
                case PROJECTILE_TYPE.NUKE:
                    fillCircleIfEmptyDirty(intX, intY, 50, METHANE, FIRE, 10);
                    fillCircleIfEmptyDirty(intX, intY, 25, NAPALM, FIRE, 80);

                    break;
                case PROJECTILE_TYPE.GRENADE:
                    if (this.ischild) {
                        fillCircle(intX, intY, 3, DIRT_PARTICLE);
                    } else {
                        fillCircle(intX, intY, 7, DIRT_PARTICLE);
                    }
                    break;
            }

            this.deactivated = true;
        }

        // Check for collision with bunkers
        bunkers.forEach(b => {
            const x = this.position.x;
            const y = this.position.y;

            if (this.checkCollisionForBunker(x, y, b)) {
                projectiles.splice(this.index,1);
                this.deactivated = true;
                b.hit(this.type);
            }
        });

        // Check for collision with other projectiles
        if (!this.deactivated) {
            for (let i = 0; i < projectiles.length; i++) {
                if (i === this.index) {continue;}

                const projX = projectiles[i].position.x;
                const projY = projectiles[i].position.y;

                const dist = (this.position.x - projX)*(this.position.x - projX) 
                + (this.position.y - projY)*(this.position.y - projY);


                if (dist <= 100 && dist > .25 && this.parentI !== projectiles[i].parentI) {
                    this.deactivated = true;
                    projectiles[i].deactivated = true;
                }
            }
        }
    }
}

class Bunker {

    constructor(posX, posY, _i, type) {
        this.position = { x: posX, y: posY };
        this.rotation = 0;
        this.projectile = null;
        this.health = 100;
        this.index = _i;
        this.hasFired = false;
        this.fireStrength = 1;
        this.evenFrame = 0;
        this.playerType = type;

        this.curProjType = PROJECTILE_TYPE.STONE;
    }

    /*
        Method called if bunker was hit by projectile.
        
        Arguments:
            _type      type of projectile that hit the bunker.
    */
    hit(_type) {
        switch (_type) {
            case PROJECTILE_TYPE.STONE: this.health -= 10; break;
            case PROJECTILE_TYPE.MISSILE: this.health -= 20; break;
        }
    }

    // OBSOLETE
    onProjectileDestroyed() {
        this.fireStrength = 0;
    }

    update(delta, imgData) {

        this.evenFrame = (this.evenFrame + 1) % 3;

        if (this.health <= 0) {
            bunkers.splice(this.index, 1);
        }

        if (this.projectile !== null && this.projectile.deactivated) {
            this.projectile = null;
            this.fireStrength = 1;
        }

        if (this.projectile !== null) {
            this.projectile.update(delta, imgData);
        }

        const x = this.position.x;
        const y = this.position.y + 9;

        if (y === canvHeight - 1) { return; }

        // Check if below is at least one element
        // If not, fall
        if (imgData[this.position.x + y * canvWidth] === BACKGROUND) {
            this.position.y += 1;
        } else {
            // Check left and right
            const leftMatch = x !== 0 && imgData[this.position.x - 1 + y * canvWidth] === BACKGROUND ?
                this.position.x - 1 : -1;

            const rightMatch = x !== (canvWidth - 1) && imgData[this.position.x + 1 + y * canvWidth] === BACKGROUND ?
                this.position.x + 1 : -1;

            if ((leftMatch !== -1) && (rightMatch !== -1)) {
                this.position.x = random() < 50 ? leftMatch : rightMatch;
            } else {

                if (leftMatch !== -1) { this.position.x = leftMatch; }
                if (rightMatch !== -1) { this.position.x = rightMatch; }
            }
        }

        if (this.hasFired && this.evenFrame === 0 && this.fireStrength < 50) {
            this.fireStrength += 1;
        }
    }

    handleInput(event) {
        if (event.key === RightMove[this.playerType]) {
            this.rotation += 3;
        } else if (event.key === LeftMove[this.playerType]) {
            this.rotation -= 3;
        }

        // Switch weapon
        if (event.key === WeaponUp[this.playerType]) {
            this.curProjType = (this.curProjType + 1) % 6;
            console.log(`Current type: ${this.curProjType}`);
        }


        // Show magnitude
        if (event.key === FireMove[this.playerType] && !this.hasFired && this.projectile === null) {
            this.hasFired = true;
        } else if (event.key === FireMove[this.playerType] && this.projectile === null && this.hasFired) {

            const strengthFactor = this.fireStrength / 50;

            const eX = this.position.x + 20 * Math.cos(this.rotation * DEG_2_RAD);
            const eY = (this.position.y - 25) + 20 * Math.sin(this.rotation * DEG_2_RAD);

            let proj = new Projectile(this.position.x, this.position.y - 25, eX, eY, strengthFactor, this.curProjType, projectiles.length - 1);
            projectiles.push(proj);
            this.projectile = proj;

            this.hasFired = false;
        }

        if (this.rotation > 0) { this.rotation = 0; }
        if (this.rotation < -180) { this.rotation = -180; }
    }

    draw(ctx) {

        if (this.projectile !== null) {
            this.projectile.draw(ctx);
        }
       
        // Draw cannon
        ctx.beginPath();
        ctx.fillStyle = '#1A237E';
        ctx.moveTo(this.position.x, this.position.y - 25);

        const lineX = this.position.x + 20 * Math.cos(this.rotation * DEG_2_RAD);
        const lineY = (this.position.y - 25) + 20 * Math.sin(this.rotation * DEG_2_RAD);


        ctx.lineTo(lineX, lineY);
        ctx.stroke();
        ctx.closePath();

        // Draw body
        ctx.drawImage(bunkerBodyImg, this.position.x - 10, this.position.y - 20, 20, 29);

        // Draw head
        if (this.health < 25) {
            ctx.drawImage(bunkerHeadRedHuge, this.position.x - 10, this.position.y - 28, 20, 10);
        } else if (this.health < 75) {
            ctx.drawImage(bunkerHeadRedLittle, this.position.x - 10, this.position.y - 28, 20, 10);
        } else {
            ctx.drawImage(bunkerHead, this.position.x - 10, this.position.y - 28, 20, 10);
        }


        const roundedHealth = Math.round(this.health * 13 / 100);

        // Draw health
        // ctx.drawImage(bunkerHealthBar, 0,13, 3, -roundedHealth, this.position.x-8, this.position.y-(18 - (13 - roundedHealth)), 3, roundedHealth);


        // Draw projectile
        /*
        switch (this.curProjType) {
            case PROJECTILE_TYPE.STONE:
                ctx.drawImage(projectileStone, this.position.x - 3, this.position.y - 17, 10, 10);
                break;
            case PROJECTILE_TYPE.LASER:
                ctx.drawImage(projectileLaser, this.position.x - 3, this.position.y - 17, 10, 10);
                break;
            case PROJECTILE_TYPE.ACID:
                ctx.drawImage(projectileAcid, this.position.x - 3, this.position.y - 17, 10, 10);
                break;
        }
        */

        ctx.font = '9px Arial';
        ctx.fillStyle = 'white';

        // Display fire strength
        ctx.fillText(this.fireStrength, this.position.x - 6, this.position.y + 6);
    }
}

function initBunkers() {
    bunkers.push(new Bunker(30, 100, 0, PLAYER_TYPE.FIRST));

    bunkers.push(new Bunker(420, 100, 1, PLAYER_TYPE.SECOND));
}

function drawBunkers(ctx) {
    bunkers.forEach(b => b.draw(ctx));
    projectiles.forEach(p => {
        if (!p.deactivated) {
            ctx.beginPath();
            p.draw(ctx);
            ctx.closePath();
        }
    });
}

function updateBunkers(delta, imgData) {
    bunkers.forEach(b => b.update(delta, imgData));

    projectiles.forEach(p => {
        if (!p.updated) {
            p.update(delta, imgData);
            p.updated = false;
        }
    });

    projectiles = projectiles.filter(p => p.deactivated !== true);
}

function handleInputBunkers(e) {
    bunkers.forEach(b => b.handleInput(e));
}