
const canvas = document.getElementById('game-canvas');
const foregroundCanvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const foregroundCtx = canvas.getContext('2d');

const testImg = document.getElementById('test');


const colors = [
    { r: 214, g: 230, b: 128, col: LIGHT_GREEN },
    { r: 183, g: 214, b: 96, col: MIDDLE_GREEN },
    { r: 120, g: 152, b: 33, col: LIGHT_BROWN },
    { r: 121, g: 84, b: 33, col: DARK_BROWN },
    { r: 166, g: 175, b: 180, col: LIGHT_GREY },
    { r: 131, g: 147, b: 140, col: DARK_GREY },
    { r: 255, g: 255, b: 255, col: WHITE },
    { r: 0, g: 0, b: 0, col: BACKGROUND },
    { r: 3, g: 116, b: 188, col: WATER }
];



/*
    This canvas is used at initialization to draw the world
    to the main game canvas.
*/
const drawCanvas = document.createElement('canvas');
const drawCanvasCtx = drawCanvas.getContext('2d');


/*
    BACKGROUND SECTION

    - Mountains
    - Clouds
    - Sun
*/
const bckgCanvas = document.getElementById('background-canvas');
const bckgCtx = bckgCanvas.getContext('2d');

const backgroundImage = document.getElementById('background-img');

const swapCanvas = document.createElement('canvas');
const swapCtx = swapCanvas.getContext('2d');

// Terrain canvas
const terrainCanvas = document.createElement('canvas');
const terrainCtx = terrainCanvas.getContext('2d');

// Pregenerated terrain
const pregeneratedTerrain = document.getElementById('pregenerated-terrain');



// Limit size of canvas
const __max_width = 480;
const __max_height = 320;

const canvWidth = Math.min(__max_width, screen.width);
const canvHeight = Math.min(__max_height, screen.height);

canvas.width = 2 * canvWidth;
canvas.height = 2 * canvHeight;

drawCanvas.width = canvWidth;
drawCanvas.height = canvHeight;

foregroundCanvas.width = 2 * canvWidth;
foregroundCanvas.height = 2 * canvHeight;

bckgCanvas.width = 2 * canvWidth;
bckgCanvas.height = 2 * canvHeight;

swapCanvas.width = canvWidth;
swapCanvas.height = canvHeight;



// Image data used for drawing
const imageData = ctx.createImageData(canvWidth, canvHeight);


// Storage for game state
let imageData32 = new Uint32Array(imageData.data.buffer);

// Set a FPS of 30
let fps = 30.0;
let msPerFrame = 1000.0 / fps;

let lastLoop = 0;
let frameDebt = 0;


// Maximum index in canvas width
const MAX_X_IDX = canvWidth - 1;

// Maximum index in canvas height
const MAX_Y_IDX = canvHeight - 1;

// Maximum index in buffer
const MAX_IDX = canvWidth * canvHeight - 1;


// let bunker = new Bunker(100,100);


/*
    Fills a rectangle with top left corner specified by x,y
    and width w and height h with the given type.

    The rectangle is drawn in the imageBuffer32 array used
    for the falling sand simulation.
 */
function fillRect(x, y, w, h, type) {

    let _x = x;
    let _y = y;

    for (_x = x; _x < x + w; _x++) {
        for (_y = y; _y < y + h; _y++) {
            imageData32[_x + _y * canvWidth] = type;
        }
    }
}

function diagonal_distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.max(Math.abs(dx), Math.abs(dy));
}

function lerp(start, end, t) {
    return start + t * (end - start);
}

function closestColorMatch(r, g, b) {

    let dist = 255 * 255 * 255;
    let col = WALL;

    for (let i = 0; i < colors.length; i++) {

        const val = (r - colors[i].r) * (r - colors[i].r) + (g - colors[i].g) * (g - colors[i].g)
            + (b - colors[i].b) * (b - colors[i].b);

        if (val < dist) {
            dist = val;
            col = colors[i].col;
        }
    }

    return col;
}


function fillLine(xStart, yStart, xEnd, yEnd, _type) {

    // Number of points for drawing line
    const N = diagonal_distance(xStart, yStart, xEnd, yEnd);

    for (let step = 0; step <= N; step++) {
        let t = N === 0 ? 0.0 : step / N;
        const x = Math.round(lerp(xStart, xEnd, t));
        const y = Math.round(lerp(yStart, yEnd, t));
        if (0 <= x && x < canvWidth && 0 <= y && y < canvHeight) {
            imageData32[x + canvWidth * y] = _type;
        } else {
            break;
        }
    }
}

function fillDirtyLine(xStart, yStart, xEnd, yEnd, _type1, _type2) {
    // Number of points for drawing line
    const N = diagonal_distance(xStart, yStart, xEnd, yEnd);

    for (let step = 0; step <= N; step++) {
        let t = N === 0 ? 0.0 : step / N;
        const x = Math.round(lerp(xStart, xEnd, t));
        const y = Math.round(lerp(yStart, yEnd, t));
        if (0 <= x && x < canvWidth && 0 <= y && y < canvHeight) {
            imageData32[x + canvWidth * y] = random() < 50 ? _type1 : _type2;
        } else {
            break;
        }
    }
}

function isInData(x, y) {
    return (0 <= x && x < canvWidth)
        && (0 <= y && y < canvHeight);
}

function insideCircle(centerX, centerY, x, y, radius) {
    let dx = centerX - x;
    let dy = centerY - y;

    return (dx * dx + dy * dy) <= radius * radius;
}

function fillCircle(centerX, centerY, radius, type) {

    let top = Math.floor(centerY - radius);
    let bottom = Math.floor(centerY + radius);
    let left = Math.floor(centerX - radius);
    let right = Math.floor(centerX + radius);

    for (let y = top; y <= bottom; y++) {
        for (let x = left; x <= right; x++) {
            if (isInData(x, y) && insideCircle(centerX, centerY, x, y, radius))
                imageData32[x + y * canvWidth] = type;
        }
    }
}

function fillCircleIfEmpty(centerX, centerY, radius, type) {
    let top = Math.floor(centerY - radius);
    let bottom = Math.floor(centerY + radius);
    let left = Math.floor(centerX - radius);
    let right = Math.floor(centerX + radius);

    for (let y = top; y <= bottom; y++) {
        for (let x = left; x <= right; x++) {
            if (isInData(x, y) && insideCircle(centerX, centerY, x, y, radius) && imageData32[x + y * canvWidth] === BACKGROUND)
                imageData32[x + y * canvWidth] = type;
        }
    }
}

function fillCircleIfEmptyDirty(centerX, centerY, radius, type1, type2, type1chance) {
    let top = Math.floor(centerY - radius);
    let bottom = Math.floor(centerY + radius);
    let left = Math.floor(centerX - radius);
    let right = Math.floor(centerX + radius);

    for (let y = top; y <= bottom; y++) {
        for (let x = left; x <= right; x++) {
            if (isInData(x, y) && insideCircle(centerX, centerY, x, y, radius) && random() < 40)
                if (random() < type1chance) {
                    imageData32[x + y * canvWidth] = type1;
                } else {
                    imageData32[x + y * canvWidth] = type2;
                }
        }
    }
}



function init() {

    ctx.scale(2, 2);

    document.getElementById('canv-wrapper').appendChild(drawCanvas);
    drawCanvas.style = 'display: none';

    drawCanvas.width = canvWidth;
    drawCanvas.height = canvHeight;


    drawCanvasCtx.clearRect(0, 0, canvWidth, canvHeight);
    drawCanvasCtx.drawImage(testImg, 0, 0, testImg.width, testImg.height);

    const imgData = drawCanvasCtx.getImageData(0, 0, canvWidth, canvHeight);


    for (let y = 0; y < canvHeight; y++) {
        for (let x = 0; x < canvWidth; x++) {

            let r, g, b;

            const pos = y * canvWidth + x;

            r = imgData.data[pos * 4 + 0];
            g = imgData.data[pos * 4 + 1];
            b = imgData.data[pos * 4 + 2];

            imageData32[pos] = closestColorMatch(r, g, b);
        }
    }


    // Initialize available elements
    initElements();
    initParticles();
    initBunkers();
    initBackground();

    ctx.imageSmoothingEnabled = false;
}

let secondsPassed;
let oldTimeStamp;
let __fps;

function updateGame() {
    var x, y;
    var i = MAX_IDX;

    const direction = MAX_Y_IDX & 1;


    // Update from bottom to top
    for (y = MAX_Y_IDX; y !== -1; y--) {
        const Y = y;
        if ((Y & 1) === direction) {
            // Go from RIGHT to LEFT
            for (x = MAX_X_IDX; x !== -1; x--) {
                const elem = imageData32[i];
                // Skip background particles
                if (elem === BACKGROUND) { i--; continue; }

                const elem_idx = ((elem & 0x30000) >>> 12) + ((elem & 0x300) >>> 6)
                    + (elem & 0x3);

                // Perform action
                elementActions[elem_idx](x, Y, i);
                i--;
            }

            i++;
        } else {
            // Go from LEFT to RIGHT
            for (x = 0; x !== canvWidth; x++) {
                const elem = imageData32[i];
                // Skip background particles
                if (elem === BACKGROUND) { i++; continue; }


                const elem_idx = ((elem & 0x30000) >>> 12) + ((elem & 0x300) >>> 6)
                    + (elem & 0x3);

                // Perform action
                elementActions[elem_idx](x, Y, i);
                i++;
            }

            i--;
        }
        i -= canvWidth;
    }
}

function draw() {

    // Draw to swap canvas
    swapCtx.putImageData(imageData, 0, 0);

    // Draw to original canvas after scaling
    ctx.drawImage(swapCanvas, 0, 0);
}



function mainLoop(timeStamp) {
    foregroundCtx.fillStyle = 'rgb(0,0,0,0)';
    foregroundCtx.fillRect(0, 0, 2 * canvWidth, 2 * canvHeight);

    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;

    updateBunkers(1 / secondsPassed, imageData32);
    updateBackground(1 / secondsPassed);
    updateGame();
    updateParticles();


    fps = Math.round(1 / secondsPassed);


    window.requestAnimationFrame(mainLoop);


    // Draw

    // Draw background


    foregroundCtx.clearRect(0, 0, 2 * canvWidth, 2 * canvHeight);

    draw();



    drawBunkers(foregroundCtx);
    drawBackground(bckgCtx);

}


/*
    Initialization on load
*/
window.onload = () => {

    window.addEventListener('keydown', (e) => {
        handleInputBunkers(e);
    });

    init();

    mainLoop(0);
}