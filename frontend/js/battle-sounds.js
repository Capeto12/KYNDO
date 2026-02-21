/**
 * KOMBATE SOUNDS - Web Audio API
 * Procedural generated sounds for the battle mode.
 */

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol = 0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

export function playAttackSound() {
    // Tono agudo corto
    playTone(880, 'square', 0.1, 0.05);
}

export function playDamageSound() {
    // Tono bajo
    playTone(150, 'sawtooth', 0.15, 0.08);
}

export function playRoundWinSound() {
    // Melodía ascendente
    playTone(440, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(554, 'sine', 0.1, 0.1), 100);
    setTimeout(() => playTone(659, 'sine', 0.2, 0.1), 200);
}

export function playRoundLoseSound() {
    // Melodía descendente
    playTone(300, 'triangle', 0.15, 0.1);
    setTimeout(() => playTone(200, 'triangle', 0.2, 0.1), 150);
}

export function playSetWinFanfare() {
    // Fanfarria
    const notes = [440, 554, 659, 880, 1108]; // A4, C#5, E5, A5, C#6
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 'square', 0.15, 0.08), i * 120);
    });
}

export function playPackOpenSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // Ruido blanco corto + tono
    const bufferSize = audioCtx.sampleRate * 0.2; // 0.2 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    noise.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();

    // Tono ascendente
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);

    oscGain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);

    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

export function playCardRevealSound() {
    playTone(440, 'sine', 0.08, 0.05);
}

export function playRareRevealSound() {
    const notes = [523, 659, 783, 1046]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 'sine', 0.1, 0.08), i * 100);
    });
}
