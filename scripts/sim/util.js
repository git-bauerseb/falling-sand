const __num_rand_ints = 8192;
const __rand_ints = new Uint8Array(__num_rand_ints); 

for (let i = 0; i < __num_rand_ints; i++) {
    __rand_ints[i] = Math.floor(Math.random() * 100);
}

let __next_rand = 0;

function random() {
    const r = __rand_ints[__next_rand];
    __next_rand = (__next_rand + 1) % __num_rand_ints;

    return r;
}