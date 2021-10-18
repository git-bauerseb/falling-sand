
let playing = false;

function initSound() {
    const audioContext = new AudioContext();


    let snd1 = new Audio();
    src1 = document.createElement('source');
    src1.type = 'audio/mpeg';
    src1.src = '../sounds/night_knight.mp3';

    snd1.appendChild(src1);

    const track = audioContext.createMediaElementSource(snd1);

    let playPromise;

    const playButton = document.querySelector('button');
    playButton.addEventListener('click', () => {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        if (!playing) {
            playPromise = snd1.play();
            playing = true;
        } else if (playing && playPromise !== undefined) {
            playPromise.then(_ => {snd1.pause();})
            playing = false;
        }

        snd1.addEventListener('ended', () => {
            playButton.dataset.playing = 'false';
        }, false);        
    });

    const gainNode = audioContext.createGain();
    track.connect(gainNode).connect(audioContext.destination);

    const volumeControl = document.querySelector('#volume');

    volumeControl.addEventListener('input', function () {
        gainNode.gain.value = this.value;
    });
}





window.onload = () => {
    initSound();
}