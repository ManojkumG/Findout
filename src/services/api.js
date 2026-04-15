// src/services/api.js

/**
 * Shortens extremely large numbers into readable format (Cr, L, B, T)
 */
const formatLargeNumbers = (text) => {
  if (!text) return "";
  // Matches any sequence of 5 or more digits
  return text.replace(/\d+/g, (match) => {
    const num = parseFloat(match);
    if (num >= 1000000000000) return (num / 1000000000000).toFixed(1) + 'T';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 10000000) return (num / 10000000).toFixed(1) + 'Cr';
    if (num >= 100000) return (num / 100000).toFixed(1) + 'L';
    return match;
  });
};

/**
 * OpenRouter Smart Search Integration
 * Fetches "Verified Profiles" and "Smart Search Results" using Entity Intelligence.
 */
export const searchPerson = async (query) => {
  const nsfwKeywords = ['porn', 'sex', '18+', 'nsfw', 'nude', 'onlyfans', 'xxx', 'xx'];
  const isSafe = !nsfwKeywords.some(keyword => query.toLowerCase().includes(keyword));

  if (!isSafe) {
    throw new Error("Content restricted. Safe search is enabled.");
  }

  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OpenRouter API Key in .env file.");
  }

  const systemPrompt = `You are the "Findout Engine" for Digital Presence and Entity Intelligence. 
  Your goal is to provide deep insights, AI job profiles, hiring networks, and employment data.
  Return a JSON array of up to 6 entities related to the query. 
  
  Guidelines for results:
  - If it's a person/role, create a "Verified Profile" (BEST category).
  - If it's a company, network, or aggregate, create a "Smart Search Result" (Second best).
  
  Each object MUST have:
  - "name": Full name, Company, or Entity Name.
  - "role": Specific job title, hiring profile, or employment category.
  - "summary": Exactly 4-6 sentences of deep "Entity Intelligence" summary (Digital Presence context). Focus on background, achievements, and professional impact.
  - "badge": Either "Verified Profile" or "Smart Search Result".
  - "imageKeyword": Specific keyword for Unsplash (person, startup office, AI technology).
  - "socials": Reddit, YouTube, LinkedIn, Blogs links.
  
  Format as a strict JSON array.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Findout AI",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Query: ${query}` }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "OpenRouter connection failed.");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error("Invalid AI Response Format.");
    }

    const rawProfiles = JSON.parse(jsonMatch[1] || jsonMatch[0]);

    return rawProfiles.map((p, index) => {
      return {
        id: `ai-search-${index}`,
        name: p.name,
        role: p.role,
        badge: p.badge || "Verified Entity",
        photoUrl: `https://loremflickr.com/800/800/${encodeURIComponent(p.imageKeyword || p.name)}`,
        summary: formatLargeNumbers(p.summary),
        socials: {
          reddit: p.socials?.reddit || `https://www.reddit.com/search/?q=${encodeURIComponent(p.name)}`,
          blog: p.socials?.blog || `https://www.google.com/search?q=${encodeURIComponent(p.name)}+blog`,
          youtube: p.socials?.youtube || `https://www.youtube.com/results?search_query=${encodeURIComponent(p.name)}`,
          linkedin: p.socials?.linkedin || `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(p.name)}`,
          twitter: p.socials?.twitter || `https://twitter.com/search?q=${encodeURIComponent(p.name)}`
        }
      };
    });

  } catch (error) {
    console.error("Search Service Error:", error);
    throw new Error(`Intelligence Hub Offline: ${error.message}`);
  }
};


// --- AUTH API MOCKS (Same as before) ---
export const loginApi = async (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === 'abcd@gmail.com' && password === 'password') {
        resolve({ user: { name: 'Test User', email } });
      } else {
        reject(new Error('Invalid email or password. Try abcd@gmail.com / password'));
      }
    }, 1000);
  });
};

export const signupApi = async (name, email, password) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ user: { name, email } });
    }, 1000);
  });
};
