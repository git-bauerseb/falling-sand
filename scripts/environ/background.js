/*
    Load sprites
*/
const cloudImg = document.getElementById('cloud');

let clouds = [];
let time = 0;
let factor = 1;
const vel = [-.01, .007, -.008, .004];

// Day color
const r1 = 135;
const g1 = 206;
const b1 = 217;

// Night color
const r2 = 26;
const g2 = 35;
const b2 = 96;


let color = {r: 199, g: 232, b: 237};

class Cloud {

    constructor(x,y,vx,vy, i) {
        this.position = {x:x, y:y};
        this.vel = {x: vx, y:vy};
        this._i = i;
        this.childCount = 0;
        this.__currentTime = 0;
        this.__rainyFactor = 1;
    }

    update(delta) {
        if (!isNaN(delta)) {
            this.position.x += delta * this.vel.x;
            this.position.y += delta * this.vel.y;

            this.__currentTime += 1;

            if (this.__currentTime === this.__rainyFactor) {
                const intX = Math.round(.5 * (this.position.x + 93) - .3 * random());
                const intY = Math.round(.5 * (this.position.y + 51));

                fillRect(intX, intY-3, 1,1, FIRE);
                this.__currentTime = 0;
            }

        }
    }

    draw(ctx) {
        ctx.drawImage(cloudImg, this.position.x, this.position.y);
    }
}



function initBackground() {
    clouds.push(new Cloud(900, 75, -.01, 0, 0));
    clouds.push(new Cloud(10, 80, .007, 0, 1));
    clouds.push(new Cloud(10, 130, .008, 0, 2));

}


function drawBackground(ctx) {


    bckgCtx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    bckgCtx.fillRect(0,0,2*canvWidth, 2*canvHeight);
    bckgCtx.drawImage(backgroundImage, 0,0);

    clouds.forEach(c => c.draw(bckgCtx));
}

function updateBackground(delta) {

    clouds.forEach(c => c.update(delta));
    /*
    if (!isNaN(delta)) {
        time += factor * .00001 * delta;

        if (time >= 1) {
            factor = -1;
            console.log('Reached 1');
        }

        if (time <= 0) {
            factor = 1;
        }
    }

    color.r = Math.round(r1 * (1 - time) + r2 * time);
    color.g = Math.round(g1 * (1 - time) + g2 * time);
    color.b = Math.round(b1 * (1 - time) + b2 * time);

    if (clouds.length < 6) {
        clouds.push(new Cloud(random() < 50 ? -random()-90 : 2 * canvWidth + random(), random(), (random() < 50 ? -1 : 1) * vel[Math.floor(random() * 4 / 100)], 0, clouds.length - 1));
    }


    */
    clouds = clouds.filter(c => !(c.position.x < - 93 || c.position.x > 2*canvWidth));
    
}