// Web Audio API Sound Engine for Abuzar's 3D Birthday Celebration
// Zero external audio files required - 100% synthesized, offline-ready, dynamic & reliable!

class BirthdayAudioEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isPlayingMusic = false;
        this.currentMusicTimer = null;
        this.tempo = 115; // BPM
        this.noteIndex = 0;
        this.partyMode = false;
        
        // Happy Birthday melody in C major (note frequencies and durations)
        // [freq, durationInBeats, restInBeats]
        this.melody = [
            { note: 'G4', beats: 0.75 }, { note: 'G4', beats: 0.25 }, { note: 'A4', beats: 1.0 }, { note: 'G4', beats: 1.0 }, { note: 'C5', beats: 1.0 }, { note: 'B4', beats: 2.0 },
            { note: 'G4', beats: 0.75 }, { note: 'G4', beats: 0.25 }, { note: 'A4', beats: 1.0 }, { note: 'G4', beats: 1.0 }, { note: 'D5', beats: 1.0 }, { note: 'C5', beats: 2.0 },
            { note: 'G4', beats: 0.75 }, { note: 'G4', beats: 0.25 }, { note: 'G5', beats: 1.0 }, { note: 'E5', beats: 1.0 }, { note: 'C5', beats: 1.0 }, { note: 'B4', beats: 1.0 }, { note: 'A4', beats: 1.0 },
            { note: 'F5', beats: 0.75 }, { note: 'F5', beats: 0.25 }, { note: 'E5', beats: 1.0 }, { note: 'C5', beats: 1.0 }, { note: 'D5', beats: 1.0 }, { note: 'C5', beats: 2.5 }
        ];

        // Frequency mapping
        this.notesFreq = {
            'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
            'C6': 1046.50
        };

        // Master gain
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
            this.musicGain.connect(this.masterGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);
        }

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.init();
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
        }
        return this.isMuted;
    }

    // Play a smooth chime / bell note
    playChimeNote(freq, startTime, duration, gainVal = 0.3) {
        if (!this.ctx || this.isMuted) return;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        // Warm electric piano / marimba chime sound
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, startTime);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, startTime); // 1 octave overtone

        // Envelope
        noteGain.gain.setValueAtTime(0.001, startTime);
        noteGain.gain.exponentialRampToValueAtTime(gainVal, startTime + 0.04);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc1.connect(noteGain);
        osc2.connect(noteGain);
        noteGain.connect(this.musicGain);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + duration);
        osc2.stop(startTime + duration);
    }

    // Play bass note for harmony
    playBassNote(freq, startTime, duration, gainVal = 0.25) {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq / 2, startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, startTime);

        bassGain.gain.setValueAtTime(0.001, startTime);
        bassGain.gain.exponentialRampToValueAtTime(gainVal, startTime + 0.05);
        bassGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(this.musicGain);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    // Drum beat: synthesized kick
    playKick(startTime) {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(140, startTime);
        osc.frequency.exponentialRampToValueAtTime(35, startTime + 0.12);

        gain.gain.setValueAtTime(0.6, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(startTime);
        osc.stop(startTime + 0.15);
    }

    // Drum beat: hihat
    playHiHat(startTime, open = false) {
        if (!this.ctx || this.isMuted) return;
        const dur = open ? 0.12 : 0.04;
        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(8000, startTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        noise.start(startTime);
    }

    // Start background birthday celebration music loop
    startMusic() {
        this.init();
        if (this.isPlayingMusic) return;
        this.isPlayingMusic = true;
        this.scheduleNextMelodyCycle();
    }

    stopMusic() {
        this.isPlayingMusic = false;
        if (this.currentMusicTimer) {
            clearTimeout(this.currentMusicTimer);
            this.currentMusicTimer = null;
        }
    }

    setPartyMode(enabled) {
        this.partyMode = enabled;
        this.tempo = enabled ? 145 : 115;
    }

    scheduleNextMelodyCycle() {
        if (!this.isPlayingMusic || !this.ctx) return;

        const secPerBeat = 60 / this.tempo;
        let currentTime = this.ctx.currentTime + 0.1;
        let totalCycleDuration = 0;

        // Schedule melody notes
        this.melody.forEach((item, index) => {
            const freq = this.notesFreq[item.note];
            const duration = item.beats * secPerBeat;
            
            this.playChimeNote(freq, currentTime, duration * 0.9, 0.35);

            // Add accompaniment chords on key beats
            if (index % 3 === 0) {
                const bassNote = item.note.startsWith('G') ? this.notesFreq['G3'] :
                                 item.note.startsWith('C') ? this.notesFreq['C3'] :
                                 item.note.startsWith('F') ? this.notesFreq['F3'] : this.notesFreq['A3'];
                this.playBassNote(bassNote, currentTime, duration * 1.5, 0.22);
            }

            // Drums
            this.playKick(currentTime);
            this.playHiHat(currentTime + duration * 0.5, false);
            if (this.partyMode) {
                this.playHiHat(currentTime + duration * 0.25, true);
            }

            currentTime += duration;
            totalCycleDuration += duration;
        });

        // Add 1.5 sec celebration rest before looping
        const restDuration = 1.5;
        totalCycleDuration += restDuration;

        this.currentMusicTimer = setTimeout(() => {
            if (this.isPlayingMusic) {
                this.scheduleNextMelodyCycle();
            }
        }, totalCycleDuration * 1000);
    }

    // Sound FX: Balloon Pop
    playPop() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        // Crisp initial impulse
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);

        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.08);

        // Burst noise
        const bufferSize = this.ctx.sampleRate * 0.06;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.5, now);
        nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

        noise.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now);
    }

    // Sound FX: Candle Blow (Wind / Breath Sweep)
    playCandleBlow() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        const duration = 0.8;

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(3.0, now);
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(250, now + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.6, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
    }

    // Sound FX: Cake Slice (Shimmering chime + slice)
    playCakeSlice() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = now + idx * 0.05;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.001, start);
            gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(start);
            osc.stop(start + 0.5);
        });
    }

    // Sound FX: Gift Unbox / Magic reveal
    playGiftOpen() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
        arpeggio.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = now + idx * 0.06;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.01, start);
            gain.gain.exponentialRampToValueAtTime(0.3, start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(start);
            osc.stop(start + 0.6);
        });
    }

    // Sound FX: Firework launch and burst
    playFireworkLaunch() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.4);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    playFireworkBurst() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        // Sub bass thump
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.3);

        // Crackles
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                if (this.isMuted || !this.ctx) return;
                const cTime = this.ctx.currentTime;
                const cOsc = this.ctx.createOscillator();
                const cGain = this.ctx.createGain();
                cOsc.type = 'square';
                cOsc.frequency.setValueAtTime(1200 + Math.random() * 800, cTime);
                cGain.gain.setValueAtTime(0.08, cTime);
                cGain.gain.exponentialRampToValueAtTime(0.001, cTime + 0.04);
                cOsc.connect(cGain);
                cGain.connect(this.sfxGain);
                cOsc.start(cTime);
                cOsc.stop(cTime + 0.04);
            }, 80 + i * 50 + Math.random() * 40);
        }
    }
}

// Global audio singleton
window.birthdayAudio = new BirthdayAudioEngine();

