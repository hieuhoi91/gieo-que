"use client";

type RoomSound = "yin-yang" | "iching" | "daily-fortune" | "love-fortune" | "career-fortune";
type SoundKind = "urn-shake" | "stick-drop" | "activity" | "reveal";

let enabled = false;
let audioContext: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

export function setRitualSoundsEnabled(value: boolean) {
  enabled = value;
}

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) return null;
  audioContext ??= new AudioContextConstructor();
  if (!noiseBuffer) {
    noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.12, audioContext.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = (Math.random() * 2 - 1) * (1 - index / channel.length);
    }
  }
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

function playTone(
  context: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
  endFrequency = frequency,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(endFrequency, 1), startAt + duration);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume * 1.55, startAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.01);
}

function playWoodTap(context: AudioContext, startAt: number, strength = 1) {
  playTone(context, 210, startAt, 0.09, 0.055 * strength, "triangle", 84);
  if (noiseBuffer) {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = noiseBuffer;
    filter.type = "lowpass";
    filter.frequency.value = 1050;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.028 * strength, startAt + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.045);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start(startAt);
    source.stop(startAt + 0.05);
  }
}

function playUrnClack(context: AudioContext, startAt: number, strength: number) {
  playTone(context, 680 + Math.random() * 180, startAt, 0.045, 0.028 * strength, "triangle", 240);
  if (!noiseBuffer) return;

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = noiseBuffer;
  filter.type = "bandpass";
  filter.frequency.value = 1850 + Math.random() * 650;
  filter.Q.value = 0.8;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.032 * strength, startAt + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.028);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start(startAt);
  source.stop(startAt + 0.035);
}

export function playRitualSound(kind: SoundKind, room?: RoomSound) {
  if (!enabled) return;
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime + 0.015;

  if (kind === "urn-shake") {
    playTone(context, 155, now, 0.66, 0.035, "triangle", 105);
    let offset = 0;
    for (let index = 0; index < 13; index += 1) {
      const impactAt = now + offset;
      const strength = 0.55 + Math.random() * 0.38;
      playWoodTap(context, impactAt, strength);
      playUrnClack(context, impactAt + 0.012, strength);
      offset += 0.055 + Math.random() * 0.075;
    }
    return;
  }
  if (kind === "stick-drop") {
    playTone(context, 620, now, 0.24, 0.06, "triangle", 180);
    playWoodTap(context, now + 0.19, 0.9);
    playTone(context, 360, now + 0.2, 0.11, 0.022, "sine", 210);
    return;
  }
  if (kind === "reveal") {
    playTone(context, 660, now, 0.36, 0.04, "sine", 530);
    playTone(context, 880, now + 0.08, 0.48, 0.024, "sine", 720);
    return;
  }

  if (room === "yin-yang") {
    playTone(context, 1180, now, 0.16, 0.055, "sine", 740);
    playTone(context, 920, now + 0.12, 0.2, 0.045, "sine", 630);
    playTone(context, 1480, now + 0.16, 0.11, 0.024, "sine", 1180);
  } else if (room === "iching") {
    playWoodTap(context, now, 0.9);
    playWoodTap(context, now + 0.14, 0.7);
    playWoodTap(context, now + 0.28, 0.55);
  } else if (room === "daily-fortune") {
    playTone(context, 740, now, 0.5, 0.04, "sine", 1040);
    playTone(context, 1110, now + 0.13, 0.42, 0.018, "sine", 950);
  } else if (room === "love-fortune") {
    playTone(context, 520, now, 0.42, 0.028, "sine", 650);
    playTone(context, 780, now + 0.1, 0.38, 0.022, "sine", 920);
  } else {
    playWoodTap(context, now, 0.65);
    playTone(context, 430, now + 0.07, 0.25, 0.035, "triangle", 280);
    playTone(context, 680, now + 0.2, 0.24, 0.018, "sine", 580);
  }
}
