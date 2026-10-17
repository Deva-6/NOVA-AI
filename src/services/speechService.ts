/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Interface declarations for Web Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type SpeechRecognitionState = 'inactive' | 'listening' | 'error';

class SpeechService {
  private recognition: any = null;
  private isRecognitionSupported: boolean = false;
  private currentAudioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        this.isRecognitionSupported = true;
      }
    }
  }

  public isSpeechRecognitionSupported(): boolean {
    return this.isRecognitionSupported;
  }

  public isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSpeaking();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Play a clean, futuristic audio chime using Web Audio API without needing external assets
   */
  public playChime(type: 'wake' | 'success' | 'reminder' | 'error') {
    if (this.isMuted) return;
    try {
      if (!this.audioContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioContext = new AudioContextClass();
        }
      }
      if (!this.audioContext) return;

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'wake') {
        // High soft two-tone chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'success') {
        // Upward triad
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.00, now + 0.1); // A5
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.36);
      } else if (type === 'reminder') {
        // Alert ping
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.setValueAtTime(830.61, now + 0.12); // G#5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.46);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.26);
      }
    } catch (e) {
      // AudioContext could be blocked by autoplay policies until user clicks
    }
  }

  /**
   * Start listening for voice commands
   */
  public startListening(options: {
    onInterim?: (text: string) => void;
    onFinal: (text: string) => void;
    onError: (error: string) => void;
    onEnd: () => void;
  }): () => void {
    if (!this.isRecognitionSupported) {
      options.onError('Speech recognition is not supported in this browser. You can type commands in the box below.');
      options.onEnd();
      return () => {};
    }

    // Stop speaking if currently speaking
    this.stopSpeaking();
    this.playChime('wake');

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRec();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    let finalTranscript = '';

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (options.onInterim && interimTranscript) {
        options.onInterim(interimTranscript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      let errorMsg = 'Could not capture audio.';
      if (event.error === 'not-allowed') {
        errorMsg = 'Microphone access denied. Please click the mic lock icon in your address bar to allow microphone access.';
      } else if (event.error === 'no-speech') {
        errorMsg = 'No speech detected. Please tap the mic and speak clearly.';
      } else if (event.error === 'network') {
        errorMsg = 'Network issue with speech recognition service.';
      }
      options.onError(errorMsg);
    };

    this.recognition.onend = () => {
      if (finalTranscript.trim()) {
        options.onFinal(finalTranscript.trim());
      }
      options.onEnd();
    };

    try {
      this.recognition.start();
    } catch (err: any) {
      options.onError('Microphone is already active or unavailable.');
      options.onEnd();
    }

    return () => {
      this.stopListening();
    };
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // already stopped
      }
      this.recognition = null;
    }
  }

  /**
   * Speak response using browser Web Speech Synthesis or base64 audio
   */
  public speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      voiceURI?: string;
      onStart?: () => void;
      onEnd?: () => void;
      audioBase64?: string;
    }
  ): void {
    if (this.isMuted) {
      options?.onEnd?.();
      return;
    }

    this.stopSpeaking();

    // If Gemini audio is provided, play high quality WAV
    if (options?.audioBase64) {
      try {
        const audio = new Audio(`data:audio/wav;base64,${options.audioBase64}`);
        this.currentAudioElement = audio;

        audio.onplay = () => options?.onStart?.();
        audio.onended = () => {
          this.currentAudioElement = null;
          options?.onEnd?.();
        };
        audio.onerror = () => {
          this.currentAudioElement = null;
          // Fallback to browser synthesis
          this.speakWithBrowserSynth(text, options);
        };
        audio.play().catch(() => {
          this.speakWithBrowserSynth(text, options);
        });
        return;
      } catch (err) {
        console.warn('Error playing base64 audio, falling back to synthesis:', err);
      }
    }

    this.speakWithBrowserSynth(text, options);
  }

  private speakWithBrowserSynth(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      voiceURI?: string;
      onStart?: () => void;
      onEnd?: () => void;
    }
  ) {
    if (!this.isSpeechSynthesisSupported()) {
      options?.onEnd?.();
      return;
    }

    // Clean text of markdown characters or brackets for smooth vocalization
    const cleanText = text
      .replace(/\[\d+\]/g, '')
      .replace(/[*_#`~]/g, '')
      .replace(/✓|•/g, '')
      .trim();

    if (!cleanText) {
      options?.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options?.rate || 1.02;
    utterance.pitch = options?.pitch || 1.0;

    // Pick best available English voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      let selectedVoice = null;
      if (options?.voiceURI) {
        selectedVoice = voices.find(v => v.voiceURI === options.voiceURI);
      }
      if (!selectedVoice) {
        // Prefer natural / google / premium sounding voices
        selectedVoice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Karen')) && v.lang.startsWith('en'))
          || voices.find(v => v.lang.startsWith('en'))
          || voices[0];
      }
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      options?.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSpeechSynthesisSupported()) return [];
    return window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
  }
}

export const speechService = new SpeechService();
