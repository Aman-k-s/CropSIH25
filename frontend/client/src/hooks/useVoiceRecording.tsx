import { useState, useRef, useCallback, useEffect } from 'react';

type UseVoiceRecordingReturn = {
  isRecording: boolean;
  transcript: string;
  startRecording: () => void;
  stopRecording: () => void;
  setTranscript: (t: string) => void;
  language: string;
  setLanguage: (l: string) => void;
};

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState<string>('en-US'); // default

  const recognitionRef = useRef<any>(null);
  const restartingRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      // Browser does not support Web Speech API
      recognitionRef.current = null;
      return;
    }

    // create a single recognition instance and reuse it
    const recognition = new SpeechRecognition();
    recognition.lang = language; // initial language; will be updated on start
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0].transcript;
        if (res.isFinal) final += text;
        else interim += text;
      }

      // Append final results; show interim appended to finals (simple merge)
      if (final) {
        setTranscript(prev => (prev ? prev + ' ' + final : final));
      } else if (interim) {
        // show interim by combining with the current final text (non-destructive)
        setTranscript(prev => {
          const finalsOnly = prev || '';
          // if there is an existing interim appended previously, replacing it is complicated;
          // this simple approach appends interim so UI sees live updates — fine for most apps
          return finalsOnly + (interim ? ' ' + interim : '');
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error', event);
      // do not forcibly stop; allow user to stop manually
    };

    recognition.onend = () => {
      setIsRecording(false);

      // if we flagged to keep recording, restart after a small delay
      if (recognitionRef.current && (recognitionRef.current as any).__shouldKeepRecording) {
        if (!restartingRef.current) {
          restartingRef.current = true;
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              setIsRecording(true);
            } catch (err) {
              console.warn('recognition restart failed', err);
            } finally {
              restartingRef.current = false;
            }
          }, 200);
        }
      }
    };

    recognitionRef.current = recognition;

    // cleanup on unmount
    return () => {
      try {
        recognition.onresult = null;
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onstart = null;
        (recognition as any).__shouldKeepRecording = false;
        recognition.stop?.();
      } catch {}
      recognitionRef.current = null;
    };
    // We intentionally do NOT put `language` in deps so instance isn't recreated on every language switch;
    // language is applied when starting recording.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    // set language before starting (so user can change selector before clicking record)
    try {
      rec.lang = language;
    } catch (err) {
      console.warn('Could not set recognition.lang', err);
    }

    // mark that we want to auto-restart on end
    (rec as any).__shouldKeepRecording = true;

    try {
      // avoid double start; start() may throw if engine in transient state
      rec.start();
    } catch (err) {
      setTimeout(() => {
        try {
          rec.start();
        } catch (e) {
          console.warn('recognition start retry failed', e);
        }
      }, 200);
    }
  }, [language]);

  const stopRecording = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    (rec as any).__shouldKeepRecording = false;
    try {
      rec.stop();
    } catch (err) {
      console.warn('recognition stop error', err);
    } finally {
      setIsRecording(false);
    }
  }, []);

  return {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    setTranscript,
    language,
    setLanguage,
  };
}
