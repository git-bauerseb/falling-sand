var _ind = 0;


function UInt32Color(r, g, b, _name) {

    let alpha = 0xff000000;

    
    // Background has 0 alpha for drawing background
    if (_ind === 0) {
        alpha = 0;
    }

    r = r & 0xfc;
    g = g & 0xfc;
    b = b & 0xfc;

    const r_idx = _ind & 0b11;
    const g_idx = (_ind & 0b1100) >>> 2;
    const b_idx = (_ind & 0b110000) >> 4;

    r += r_idx;
    g += g_idx;
    b += b_idx;

    console.log(`Color: ${_name}, R:${r}, G:${g}, B:${b}, Index: ${_ind}`);

    _ind += 1;

    return alpha + (b << 16) + (g << 8) + r;
}

function CallAction(r, g, b) {
    let index = (r & 0x3) + ((g & 0x300) >> 6) + ((b & 0x30000) >> 12);
    return elementActions[index]();
}


/**
 * ELEMENTS
 */
const BACKGROUND = UInt32Color(0, 0, 0, 'Background');
const SAND = UInt32Color(255, 235, 59, 'Sand');
const SALT = UInt32Color(5, 5, 5, 'Salt');
const WATER = UInt32Color(2, 119, 189, 'Water');
const WALL = UInt32Color(33, 33, 33, 'Wall');
const FIRE = UInt32Color(255, 0, 10, 'Fire');
const STEAM = UInt32Color(195, 214, 235, 'Steam');
const DIRT_PARTICLE = UInt32Color(97, 97, 97, 'Dirt Particle');
const ACID = UInt32Color(157, 240, 40,'Acid');
const EARTH = UInt32Color(121, 85, 34, 'Earth');
const LIGHT_GREEN = UInt32Color(212, 228, 130, 'Light green');
const MIDDLE_GREEN = UInt32Color(181, 214, 99, 'Middle green');
const DARK_GREEN = UInt32Color(159, 187, 87, 'Dark green');
const WHITE = UInt32Color(255,255,255, 'White');
const LIGHT_GREY = UInt32Color(164, 174, 183, 'Light grey');
const DARK_GREY = UInt32Color(128,144,143, 'Dark grey');

const LIGHT_BROWN = UInt32Color(122,154,32, 'Light brown');
const DARK_BROWN = UInt32Color(121,85,34,'Dark brown');


const GREEN_3 = UInt32Color(121,85,34,'Dark brown');

const elements = new Uint32Array([
    BACKGROUND,
    SAND,
    SALT,
    WATER,
    WALL,
    FIRE,
    STEAM,
    DIRT_PARTICLE,
    ACID,
    EARTH,
    LIGHT_GREEN,
    MIDDLE_GREEN,
    DARK_GREEN,
    WHITE,
    LIGHT_GREY,
    DARK_GREY,
    LIGHT_BROWN,
    DARK_BROWN
]);

const elementActions = [
    BACKGROUND_ACTION,
    SAND_ACTION,
    SALT_ACTION,
    WATER_ACTION,
    WALL_ACTION,
    FIRE_ACTION,
    STEAM_ACTION,
    DIRT_PARTICLE_ACTION,
    ACID_ACTION,
    EARTH_ACTION,
    LIGHT_GREEN_ACTION,
    MIDDLE_GREEN_ACTION,
    DARK_GREEN_ACTION,
    WHITE_ACTION,
    LIGHT_GREY_ACTION,
    DARK_GREY_ACTION,
    LIGHT_BROWN_ACTION,
    DARK_BROWN_ACTION,
    GREEN_3
];


const affectedByProjectile = [
    SAND,
    WATER,
    WALL,
    FIRE,
    LIGHT_GREEN,
    MIDDLE_GREEN,
    DARK_GREEN,
    WHITE,
    LIGHT_GREY,
    DARK_GREY,
    LIGHT_BROWN,
    DARK_BROWN,
    GREEN_3_ACTION
];

/*
    Function for initializing available elements
    in simulation.
*/
function initElements() {

    const colors = {};

    for (let i = 0; i < elements.length; i++) {
        const color = elements[i];
        // Index of color in action array
        const color_idx = ((color & 0x30000) >>> 12)
            + ((color & 0x300) >>> 6) + (color & 0x3);

        if (color_idx !== i) {
            console.log(`[Elements]: Error in element order; color_idx: ${color_idx}`);
        }

        if (color in colors) {
            throw 'Duplicate color';
        }
    }

}



/*
    =================== ELEMENT ACTION HANDLER ====================
*/
function BACKGROUND_ACTION(x, y, i) { }

function GREEN_3_ACTION(x,y,i) {}

function LIGHT_GREEN_ACTION(x, y, i) {
    if (doGravity(x, y, i, true, 3)) { return; }

}
function MIDDLE_GREEN_ACTION(x, y, i) {
    if (doGravity(x, y, i, true, 3)) { return; }
}
function DARK_GREEN_ACTION(x, y, i) { }
function LIGHT_GREY_ACTION(x, y, i) {
     // Can sink through water

     if (doGravity(x, y, i, true, 3)) { return; }
}
function DARK_GREY_ACTION(x, y, i) {
     // Can sink through water

     if (doGravity(x, y, i, true, 3)) { return; }
}
function LIGHT_BROWN_ACTION(x, y, i) { }
function DARK_BROWN_ACTION(x, y, i) { }

function WHITE_ACTION(x, y, i) {
     // Can sink through water
     if (doDensitySink(x, y, i, WATER, true, 25)) { return; }

     if (doGravity(x, y, i, true, 40)) { return; }
 }


function EARTH_ACTION(x, y, i) {
    // Can sink through water
    if (doDensitySink(x, y, i, WATER, true, 25)) { return; }

    if (doGravity(x, y, i, true, 60)) { return; }
}

function SAND_ACTION(x, y, i) {


    // Can sink through water
    if (doDensitySink(x, y, i, WATER, true, 25)) { return; }

    if (doGravity(x, y, i, true, 60)) { return; }
}

function WALL_ACTION(x, y, i) { }

function SALT_ACTION(x, y, i) {
    if (doGravity(x, y, i, true, 95)) { return; }
}

function WATER_ACTION(x, y, i) {
    if (doGravity(x, y, i, true, 95)) return;
}

function FIRE_ACTION(x, y, i) {

    if (random() < 10) {
        imageData32[i] = BACKGROUND;
        return;
    }

    if (random() < 80) {
        let waterLoc = bordering(x, y, i, WATER);

        if (waterLoc !== -1) {
            imageData32[waterLoc] = STEAM;
            imageData32[i] = BACKGROUND;
            return;
        }
    }

    // Rise fire
    if (random() < 50) {
        const riseLoc = above(y, i, BACKGROUND);
        if (riseLoc !== -1) {
            imageData32[riseLoc] = FIRE;
            imageData32[i] = BACKGROUND;
            return;
        }
    }
}

function DIRT_PARTICLE_ACTION(x, y, i) {

    if (random() < 10) {
        imageData32[i] = BACKGROUND;
        return;
    }

    // Rise fire
    if (random() < 30) {
        const riseLoc = above(y, i, BACKGROUND);
        if (riseLoc !== -1) {
            imageData32[riseLoc] = DIRT_PARTICLE;
            imageData32[i] = BACKGROUND;
            return;
        }
    }
}

function STEAM_ACTION(x, y, i) {
    if (doRise(x, y, i, 70, 60)) { return; }
}

function ACID_ACTION(x, y, i) {
    if (random() < 3) {
        const up = y > 0 ? y - 1 : -1;
        const down = y < MAX_Y_IDX ? y + 1 : -1;
        const left = x > 0 ? x - 1 : -1;
        const right = x < MAX_X_IDX ? x + 1 : -1;
        const xLocs = [left, right, x];
        const yLocs = [down, up, y];
        /* Don't bias left/right or up/down */
        if (random() < 50) {
            xLocs[0] = right;
            xLocs[1] = left;
        }
        if (random() < 50) {
            yLocs[0] = up;
            yLocs[1] = down;
        }
        var xLocsIter, yLocsIter;
        for (yLocsIter = 0; yLocsIter !== 3; yLocsIter++) {
            const yIter = yLocs[yLocsIter];
            if (yIter === -1) continue;

            if (random() < 25 && yIter !== down)
                continue;

            const idxBase = yIter * canvWidth;
            for (xLocsIter = 0; xLocsIter !== 3; xLocsIter++) {
                const xIter = xLocs[xLocsIter];
                if (xIter === -1) continue;

                if (yIter === y && xIter === x) continue;

                /* Don't consider corners */
                if (xIter !== x && yIter !== y) continue;

                const idx = idxBase + xIter;
                const borderingElem = imageData32[idx];

                if (borderingElem === ACID ||
                    borderingElem === BACKGROUND)
                    continue;

                if (yIter !== y + 1) {
                    imageData32[idx] = BACKGROUND;
                    return;
                }

                imageData32[i] = BACKGROUND;
                if (borderingElem !== WALL || random() < 75)
                    imageData32[idx] = ACID;
                return;
            }
        }
    }


    if (doGravity(x, y, i, true, 100)) return;
}

/*
    =================== HELPER FUNCTIONS ====================
*/


/*
    Applies gravity to an element.
 */
function doGravity(x, y, i, fallAdjacent, chance) {
    if (random() >= chance) { return false; }

    // If at bottom then element is fallen out of window
    if (y === MAX_Y_IDX) {
        imageData32[i] = BACKGROUND;
        return true;
    }

    let newI;

    // Check below diagonally if enabled
    if (fallAdjacent) {
        newI = belowAdjacent(x, y, i, BACKGROUND);
    } else {
        // Else only check directly below
        newI = below(y, i, BACKGROUND);
    }

    if (newI === -1 && fallAdjacent) { newI = adjacent(x, i, BACKGROUND); }

    // Update if valid position
    if (newI !== -1 && y < MAX_Y_IDX - 1) {
        imageData32[newI] = imageData32[i];
        imageData32[i] = BACKGROUND;
        return true;
    }


    return false;
}


/*
    Checks if a particle with the specified type
    is below the given position and returns the index of it.
 */
function below(y, i, type) {
    if (y == MAX_Y_IDX) { return -1; }

    const belowSpot = i + canvWidth;
    if (imageData32[belowSpot] === type) { return belowSpot; }
    return -1;
}

/*
    Checks value below and diagonally below
*/
function belowAdjacent(x, y, i, type) {
    if (y == MAX_Y_IDX) { return -1; }

    const belowSpot = i + canvWidth;

    if (imageData32[belowSpot] == type) { return belowSpot; }

    const belowLeftSpot = belowSpot - 1;
    const belowRightSpot = belowSpot + 1;

    const belowLeftSpotMatch = x !== 0 && imageData32[belowLeftSpot] === type ? belowLeftSpot : -1;
    const belowRightSpotMatch = x !== MAX_X_IDX && imageData32[belowRightSpot] === type ? belowRightSpot : -1;

    return __pickRandValid(belowLeftSpotMatch, belowRightSpotMatch);
}

/*
    Check value right or to left
*/
function adjacent(x, i, type) {
    const leftSpot = i - 1;
    const rightSpot = i + 1;

    const leftMatch = x !== 0 && imageData32[leftSpot] === type ? leftSpot : -1;
    const rightMatch = x !== 0 && imageData32[rightSpot] === type ? rightSpot : -1;

    return __pickRandValid(leftMatch, rightMatch);
}

function above(y, i, type) {
    if (y === 0) { return -1; }
    const aboveSpot = i - __max_width;
    if (imageData32[aboveSpot] === type) return aboveSpot;

    return -1;
}

function aboveAdjacent(x, y, i, type) {
    if (y === 0) { return -1; }

    const aboveSpot = i - canvWidth;
    if (imageData32[aboveSpot] === type) { return aboveSpot; }

    const aboveLeftSpot = aboveSpot - 1;
    const aboveLeftMatch =
        x !== 0 && imageData32[aboveLeftSpot] === type ? aboveLeftSpot : -1;

    const aboveRightSpot = aboveSpot + 1;
    const aboveRightMatch =
        x !== MAX_X_IDX && imageData32[aboveRightSpot] === type
            ? aboveRightSpot
            : -1;

    return __pickRandValid(aboveLeftMatch, aboveRightMatch);
}

/*
    Picks randomly a or b by equal probability
*/
function __pickRandValid(a, b) {
    const aValid = a !== -1;
    const bValid = b !== -1;

    if (aValid && bValid) { return random() < 50 ? a : b; }
    else if (aValid) return a;
    else if (bValid) return b;
    else return -1;
}

/*
    Sink element if its on top of less dense objects (heavierThan)
*/
function doDensitySink(x, y, i, heavierThan, sinkAdjacent, chance) {
    if (random() >= chance) { return false; }

    if (y === MAX_Y_IDX) { return false; }

    let newI;
    if (sinkAdjacent) {
        newI = belowAdjacent(x, y, i, heavierThan);
    } else {
        newI = below(y, i, heavierThan);
    }

    if (newI === -1) { return false; }

    imageData32[newI] = imageData32[i];
    imageData32[i] = heavierThan;
    return true;
}

function doDensityLiquid(x, y, i, heavierThan, sinkChance, equalizeChance) {
    let newI = -1;

    if (random() < sinkChance) { newI = belowAdjacent(x, y, i, heavierThan); }

    if (newI === -1 && random() < equalizeChance) {
        newI = adjacent(x, i, heavierThan);
    }

    if (newI === -1) return;

    imageData32[newI] = imageData32[i];
    imageData32[i] = heavierThan;
}

function doRise(x, y, i, riseChance, adjacentChance) {
    let newI = -1;
    if (random() < riseChance) {
        if (y === 0) {
            imageData32[i] = BACKGROUND;
            return true;
        } else {
            newI = aboveAdjacent(x, y, i, BACKGROUND);
        }
    }

    if (newI === -1 && random() < adjacentChance) {
        newI = adjacent(x, i, BACKGROUND);
    }

    if (newI !== -1) {
        imageData32[newI] = imageData32[i];
        imageData32[i] = BACKGROUND;
        return true;
    }

    return false;
}

function bordering(x, y, i, type) {
    if (y !== 0 && imageData32[i - canvWidth] === type) { return i - canvWidth; }
    if (y !== (MAX_Y_IDX - 1) && imageData32[i + canvWidth] === type) { return i + canvWidth; }
    if (x !== 0 && imageData32[i - 1] === type) { return i - 1; }
    if (x !== (MAX_X_IDX - 1) && imageData32[i + 1] === type) { return i + 1; }

    return -1;
}