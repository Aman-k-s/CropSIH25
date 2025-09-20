// src/lib/gemini.ts (client) — named export, robust logs (dev) with session management
// Drop-in TypeScript file for frontend usage.
// Usage: import { askCropQuestion, clearConversationHistory, getCurrentSessionId, getUserLocation } from './lib/gemini';

let sessionId: string | null = null;

// Initialize session ID on first load
const initializeSession = () => {
  if (typeof window !== 'undefined') {
    try {
      sessionId = localStorage.getItem('chatSessionId');
    } catch (e) {
      console.warn('[initializeSession] localStorage not available', e);
      sessionId = null;
    }
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        localStorage.setItem('chatSessionId', sessionId);
      } catch (e) {
        console.warn('[initializeSession] failed to set localStorage', e);
      }
      console.log('[initializeSession] created new sessionId:', sessionId);
    } else {
      console.log('[initializeSession] loaded existing sessionId:', sessionId);
    }
  }
  return sessionId;
};

// Initialize session when module loads
initializeSession();

export type Location = { lat: number; lon: number } | null;

export async function getUserLocation(timeoutMs = 10000): Promise<Location> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    console.warn('[getUserLocation] geolocation not available');
    return null;
  }

  console.log('[getUserLocation] requesting location permission...');

  return new Promise((resolve) => {
    const onSuccess = (pos: GeolocationPosition) => {
      // Round to 3 decimals to reduce precision for privacy
      const lat = Math.round(pos.coords.latitude * 1000) / 1000;
      const lon = Math.round(pos.coords.longitude * 1000) / 1000;
      console.log('[getUserLocation] location obtained:', { lat, lon });
      resolve({ lat, lon });
    };

    const onError = (err: GeolocationPositionError) => {
      console.warn('[getUserLocation] geolocation error:', err.code, err.message);
      
      switch(err.code) {
        case err.PERMISSION_DENIED:
          console.warn('[getUserLocation] user denied location permission');
          break;
        case err.POSITION_UNAVAILABLE:
          console.warn('[getUserLocation] location information unavailable');
          break;
        case err.TIMEOUT:
          console.warn('[getUserLocation] location request timeout');
          break;
        default:
          console.warn('[getUserLocation] unknown geolocation error');
          break;
      }
      
      resolve(null);
    };

    const options: PositionOptions = {
      enableHighAccuracy: false,
      timeout: timeoutMs,
      maximumAge: 10 * 60 * 1000, // 10 minutes cache
    };

    // This call will trigger the browser's permission popup if permission hasn't been granted
    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
  });
}

export async function askCropQuestion(
  question: string,
  options: {
    clearHistory?: boolean;
    timeoutMs?: number;
    location?: Location; // optional location to send to server
  } = {}
) {
  const { clearHistory = false, timeoutMs = 15000, location = null } = options;

  console.log('[askCropQuestion] called with:', question);
  console.log('[askCropQuestion] options:', { clearHistory, timeoutMs, location });
  console.log('[askCropQuestion] sessionId:', sessionId);

  // Ensure we have a session ID
  if (!sessionId) {
    initializeSession();
  }

  // If you use a dev proxy, leave BASE_URL empty ''. Otherwise set REACT_APP_API_BASE_URL to e.g. http://localhost:5000
  const BASE_URL = process.env.REACT_APP_API_BASE_URL ?? '';
  const url = `${BASE_URL}/api/a`;
  console.log('[askCropQuestion] posting to URL:', url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const requestBody: any = {
      question,
      sessionId,
      clearHistory,
    };

    if (location) {
      requestBody.location = location;
    }

    console.log('[askCropQuestion] request body:', requestBody);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    console.log('[askCropQuestion] fetch resolved, status=', res.status);

    if (!res.ok) {
      let errText = '';
      try {
        errText = await res.text();
      } catch {
        errText = String(res.status);
      }
      console.error('[askCropQuestion] non-OK response:', res.status, errText);
      throw new Error(`API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    console.log('[askCropQuestion] response JSON:', data);

    // Update session ID if server returned a new one
    if (data.sessionId && data.sessionId !== sessionId && typeof window !== 'undefined') {
      sessionId = data.sessionId;
      if (sessionId != null) {
        try {
          localStorage.setItem('chatSessionId', sessionId);
        } catch (e) {
          console.warn('[askCropQuestion] failed to set localStorage', e);
        }
      }
      console.log('[askCropQuestion] updated sessionId to:', sessionId);
    }

    // Log conversation stats
    if (data.conversationLength !== undefined) {
      console.log('[askCropQuestion] conversation length:', data.conversationLength);
    }

    return data.reply;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.error('[askCropQuestion] request timed out');
      throw new Error('Request timed out');
    }
    console.error('[askCropQuestion] threw error:', err);
    throw err;
  }
}

// Function to clear conversation history
export async function clearConversationHistory(timeoutMs = 5000) {
  console.log('[clearConversationHistory] called for sessionId:', sessionId);

  if (!sessionId) {
    console.log('[clearConversationHistory] no sessionId, initializing new session');
    initializeSession();
    return true;
  }

  const BASE_URL = process.env.REACT_APP_API_BASE_URL ?? '';
  const url = `${BASE_URL}/api/a/history/${sessionId}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    console.log('[clearConversationHistory] response status:', res.status);

    if (res.ok) {
      // Generate new session ID after clearing
      if (typeof window !== 'undefined') {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
          localStorage.setItem('chatSessionId', sessionId);
        } catch (e) {
          console.warn('[clearConversationHistory] failed to set localStorage', e);
        }
        console.log('[clearConversationHistory] generated new sessionId:', sessionId);
      }
      return true;
    } else {
      console.error('[clearConversationHistory] failed with status:', res.status);
      return false;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.error('[clearConversationHistory] request timed out');
    } else {
      console.error('[clearConversationHistory] error:', err);
    }
    return false;
  }
}

// Function to get current session ID
export function getCurrentSessionId() {
  return sessionId;
}

// Function to get conversation history (optional - for debugging or UI features)
export async function getConversationHistory(timeoutMs = 5000) {
  console.log('[getConversationHistory] called for sessionId:', sessionId);

  if (!sessionId) {
    console.log('[getConversationHistory] no sessionId available');
    return { history: [], length: 0 };
  }

  const BASE_URL = process.env.REACT_APP_API_BASE_URL ?? '';
  const url = `${BASE_URL}/api/a/history/${sessionId}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    console.log('[getConversationHistory] response status:', res.status);

    if (res.ok) {
      const data = await res.json();
      console.log('[getConversationHistory] history data:', data);
      return data;
    } else {
      console.error('[getConversationHistory] failed with status:', res.status);
      return { history: [], length: 0 };
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.error('[getConversationHistory] request timed out');
    } else {
      console.error('[getConversationHistory] error:', err);
    }
    return { history: [], length: 0 };
  }
}