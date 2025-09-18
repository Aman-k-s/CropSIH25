// src/lib/gemini.ts (client) — named export, robust logs (dev) with session management
let sessionId: string | null = null;

// Initialize session ID on first load
const initializeSession = () => {
  if (typeof window !== 'undefined') {
    sessionId = localStorage.getItem('chatSessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chatSessionId', sessionId);
      console.log('[initializeSession] created new sessionId:', sessionId);
    } else {
      console.log('[initializeSession] loaded existing sessionId:', sessionId);
    }
  }
  return sessionId;
};

// Initialize session when module loads
initializeSession();

export async function askCropQuestion(
  question: string, 
  options: { 
    clearHistory?: boolean; 
    timeoutMs?: number;
  } = {}
) {
  const { clearHistory = false, timeoutMs = 15000 } = options;
  
  console.log('[askCropQuestion] called with:', question);
  console.log('[askCropQuestion] options:', { clearHistory, timeoutMs });
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
    const requestBody = {
      question,
      sessionId,
      clearHistory
    };
    
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
      try { errText = await res.text(); } catch { errText = String(res.status); }
      console.error('[askCropQuestion] non-OK response:', res.status, errText);
      throw new Error(`API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    console.log('[askCropQuestion] response JSON:', data);
    
    // Update session ID if server returned a new one
    if (data.sessionId && data.sessionId !== sessionId && typeof window !== 'undefined') {
      sessionId = data.sessionId;
      localStorage.setItem('chatSessionId', sessionId);
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
        localStorage.setItem('chatSessionId', sessionId);
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

// Function to start a new conversation (client-side only)
// export function startNewConversation() {
//   console.log('[startNewConversation] starting new conversation');
  
//   if (typeof window !== 'undefined') {
//     sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//     localStorage.setItem('chatSessionId', sessionId);
//     console.log('[startNewConversation] created new sessionId:', sessionId);
//   }
  
//   return sessionId;
// }

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