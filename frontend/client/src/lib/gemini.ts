// src/lib/gemini.ts (client) — named export, robust logs (dev)
export async function askCropQuestion(question: string, timeoutMs = 15000) {
  console.log('[askCropQuestion] called with:', question);

  // If you use a dev proxy, leave BASE_URL empty ''. Otherwise set REACT_APP_API_BASE_URL to e.g. http://localhost:5000
  const BASE_URL = process.env.REACT_APP_API_BASE_URL ?? '';
  const url = `${BASE_URL}/api/a`;
  console.log('[askCropQuestion] posting to URL:', url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
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

// export async function askCropQuestion(question: string) {
//   console.log('[askCropQuestion] called with:', question);

//   const url = 'http://localhost:5000/api/a'; // explicit backend port
//   console.log('[askCropQuestion] posting to URL:', url);

//   const res = await fetch(url, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ question }),
//   });

//   console.log('[askCropQuestion] fetch resolved, status=', res.status);

//   const data = await res.json();
//   console.log('[askCropQuestion] response JSON:', data);
//   return data.reply;
// }
