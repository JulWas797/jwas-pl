import { useEffect } from 'react'

let audioContext = null
let sharedNoiseBuffer = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      audioContext = new AudioContextClass()
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {})
  }
  return audioContext
}

function getNoiseBuffer(ctx) {
  if (sharedNoiseBuffer) return sharedNoiseBuffer
  const length = Math.floor(ctx.sampleRate * 0.4)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const channel = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    channel[i] = Math.random() * 2 - 1
  }
  sharedNoiseBuffer = buffer
  return buffer
}

export function playTone(startFreq, duration = 0.03, wave = 'triangle', volume = 0.06, endFreq = null) {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = wave
    osc.frequency.setValueAtTime(startFreq, now)
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration)
    }
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + duration + 0.005)
  } catch {
    return
  }
}

export function playTapClick(pitch = 680) {
  playTone(pitch, 0.022, 'triangle', 0.06, pitch * 0.45)
}

const AXEL_F_SEQUENCE = (() => {
  const leadNotes = new Array(64).fill(0)
  const leadLengths = new Array(64).fill(1)
  const place = (step, frequency, lengthInSteps) => {
    leadNotes[step] = frequency
    leadLengths[step] = lengthInSteps
  }

  place(0, 349.23, 3)
  place(4, 415.3, 2)
  place(7, 349.23, 1.5)
  place(9, 349.23, 1)
  place(10, 466.16, 2)
  place(12, 349.23, 2)
  place(14, 311.13, 2)

  place(16, 349.23, 3)
  place(20, 523.25, 2)
  place(23, 349.23, 1.5)
  place(25, 349.23, 1)
  place(26, 554.37, 2)
  place(28, 523.25, 2)
  place(30, 415.3, 2)

  place(32, 349.23, 2)
  place(34, 523.25, 2)
  place(36, 698.46, 2)
  place(38, 349.23, 1)
  place(39, 311.13, 2)
  place(42, 311.13, 1)
  place(43, 261.63, 2)
  place(45, 392.0, 2)
  place(47, 349.23, 5)

  const bassRoots = [87.31, 69.3, 77.78, 87.31]
  const steps = []
  for (let i = 0; i < 64; i++) {
    const bar = Math.floor(i / 16)
    const stepInBar = i % 16
    const root = bassRoots[bar]
    const hasBass =
      stepInBar === 0 ||
      stepInBar === 3 ||
      stepInBar === 6 ||
      stepInBar === 8 ||
      stepInBar === 11 ||
      stepInBar === 14
    const bassFreq = hasBass ? root : 0
    const hasKick = stepInBar === 0 || stepInBar === 8 || (bar === 3 && stepInBar === 10)
    const hasSnare = stepInBar === 4 || stepInBar === 12
    const hasHat = stepInBar % 2 === 0
    steps.push([leadNotes[i], leadLengths[i], bassFreq, hasKick, hasSnare, hasHat])
  }
  return steps
})()

export function useSnakeAudio(active) {
  useEffect(() => {
    if (!active) return

    const stepDuration = 60 / 118 / 4
    let stepIndex = 0
    let nextStepTime = 0
    let schedulerId = null

    const scheduleStep = (ctx, when, index) => {
      const [leadFreq, leadSteps, bassFreq, hasKick, hasSnare, hasHat] = AXEL_F_SEQUENCE[index]

      if (leadFreq > 0) {
        const duration = stepDuration * leadSteps * 0.92
        const osc = ctx.createOscillator()
        const filter = ctx.createBiquadFilter()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(leadFreq, when)
        filter.type = 'lowpass'
        filter.Q.setValueAtTime(2.5, when)
        filter.frequency.setValueAtTime(2800, when)
        filter.frequency.exponentialRampToValueAtTime(900, when + duration)
        gain.gain.setValueAtTime(0.032, when)
        gain.gain.exponentialRampToValueAtTime(0.0001, when + duration)
        osc.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        osc.start(when)
        osc.stop(when + duration + 0.02)
      }

      if (bassFreq > 0) {
        const duration = stepDuration * 1.4
        const osc = ctx.createOscillator()
        const filter = ctx.createBiquadFilter()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(bassFreq, when)
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(650, when)
        filter.frequency.exponentialRampToValueAtTime(160, when + duration)
        gain.gain.setValueAtTime(0.065, when)
        gain.gain.exponentialRampToValueAtTime(0.0001, when + duration)
        osc.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        osc.start(when)
        osc.stop(when + duration + 0.02)
      }

      if (hasKick) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(140, when)
        osc.frequency.exponentialRampToValueAtTime(42, when + 0.08)
        gain.gain.setValueAtTime(0.09, when)
        gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.11)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(when)
        osc.stop(when + 0.12)
      }

      if (hasSnare) {
        const source = ctx.createBufferSource()
        source.buffer = getNoiseBuffer(ctx)
        const filter = ctx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.setValueAtTime(1700, when)
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.045, when)
        gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.11)
        source.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        source.start(when)
        source.stop(when + 0.12)
      }

      if (hasHat) {
        const source = ctx.createBufferSource()
        source.buffer = getNoiseBuffer(ctx)
        const filter = ctx.createBiquadFilter()
        filter.type = 'highpass'
        filter.frequency.setValueAtTime(7500, when)
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.015, when)
        gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.035)
        source.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        source.start(when)
        source.stop(when + 0.04)
      }
    }

    try {
      const ctx = getAudioContext()
      if (!ctx) return
      nextStepTime = ctx.currentTime + 0.04

      const runScheduler = () => {
        while (nextStepTime < ctx.currentTime + 0.15) {
          scheduleStep(ctx, nextStepTime, stepIndex)
          nextStepTime += stepDuration
          stepIndex = (stepIndex + 1) % AXEL_F_SEQUENCE.length
        }
      }

      runScheduler()
      schedulerId = setInterval(runScheduler, 30)
    } catch {
      return
    }

    return () => {
      clearInterval(schedulerId)
    }
  }, [active])
}
