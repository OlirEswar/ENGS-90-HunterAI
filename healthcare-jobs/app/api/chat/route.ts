// Polyfill DOMMatrix for serverless environments (Vercel) where browser APIs are missing.
// pdfjs-dist (used by pdf-parse) references DOMMatrix at load time.
if (typeof globalThis.DOMMatrix === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a: number; b: number; c: number; d: number; e: number; f: number;
    m11: number; m12: number; m13 = 0; m14 = 0;
    m21: number; m22: number; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41: number; m42: number; m43 = 0; m44 = 1;
    is2D = true;

    constructor(init?: number[] | Float32Array | Float64Array) {
      const v = init && init.length >= 6 ? Array.from(init) : [1, 0, 0, 1, 0, 0];
      this.a = this.m11 = v[0];
      this.b = this.m12 = v[1];
      this.c = this.m21 = v[2];
      this.d = this.m22 = v[3];
      this.e = this.m41 = v[4];
      this.f = this.m42 = v[5];
      if (init && init.length === 16) {
        this.is2D = false;
        this.m13 = v[2]; this.m14 = v[3];
        this.m21 = v[4]; this.m22 = v[5]; this.m23 = v[6]; this.m24 = v[7];
        this.m31 = v[8]; this.m32 = v[9]; this.m33 = v[10]; this.m34 = v[11];
        this.m41 = v[12]; this.m42 = v[13]; this.m43 = v[14]; this.m44 = v[15];
        this.a = v[0]; this.b = v[1]; this.c = v[4]; this.d = v[5]; this.e = v[12]; this.f = v[13];
      }
    }

    static fromMatrix(other: any) { return new DOMMatrix([other.a, other.b, other.c, other.d, other.e, other.f]); }
    static fromFloat32Array(a: Float32Array) { return new DOMMatrix(Array.from(a)); }
    static fromFloat64Array(a: Float64Array) { return new DOMMatrix(Array.from(a)); }

    inverse() {
      const det = this.a * this.d - this.b * this.c;
      if (det === 0) return new DOMMatrix([0, 0, 0, 0, 0, 0]);
      return new DOMMatrix([
        this.d / det, -this.b / det,
        -this.c / det, this.a / det,
        (this.c * this.f - this.d * this.e) / det,
        (this.b * this.e - this.a * this.f) / det,
      ]);
    }

    multiply(other: any) {
      return new DOMMatrix([
        this.a * other.a + this.c * other.b,
        this.b * other.a + this.d * other.b,
        this.a * other.c + this.c * other.d,
        this.b * other.c + this.d * other.d,
        this.a * other.e + this.c * other.f + this.e,
        this.b * other.e + this.d * other.f + this.f,
      ]);
    }

    transformPoint(point?: { x?: number; y?: number }) {
      const x = point?.x ?? 0, y = point?.y ?? 0;
      return { x: this.a * x + this.c * y + this.e, y: this.b * x + this.d * y + this.f, z: 0, w: 1 };
    }
  };
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const OPENAI_API_KEY = process.env.OPEN_AI_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;
const FETCH_TIMEOUT_MS = 30000;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAIWithRetry(messages: Array<{ role: string; content: string }>): Promise<string> {
  let lastError: string = 'Failed to get response from AI';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 500,
          }),
        },
        FETCH_TIMEOUT_MS
      );

      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
      }

      const errorData = await response.text();
      console.error(`OpenAI API error (attempt ${attempt + 1}/${MAX_RETRIES}):`, response.status, errorData);

      // Only retry on transient errors (rate limit, server errors)
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable) {
        let detail = 'Failed to get response from AI';
        try {
          const parsed = JSON.parse(errorData);
          detail = parsed?.error?.message || detail;
        } catch {}
        throw new Error(detail);
      }

      lastError = `OpenAI returned ${response.status}`;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.error(`OpenAI request timed out (attempt ${attempt + 1}/${MAX_RETRIES})`);
        lastError = 'Request timed out';
      } else if (err instanceof Error && !err.message.startsWith('Failed to get response')) {
        // Network error or timeout — retryable
        console.error(`OpenAI fetch error (attempt ${attempt + 1}/${MAX_RETRIES}):`, err);
        lastError = err.message;
      } else {
        // Non-retryable error (e.g. 400/401/403) — throw immediately
        throw err;
      }
    }

    // Exponential backoff before next retry
    if (attempt < MAX_RETRIES - 1) {
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }

  throw new Error(lastError);
}

const SYSTEM_PROMPT = `You are Carey, an AI career coach on a hiring platform designed to help people find entry-level healthcare jobs. These roles include positions like medical assistant, personal care aide, home health aide, nursing assistant, patient transporter, and similar jobs that do not require a four-year degree.

Many of the people you speak with may be:
- Starting their first healthcare job
- Pivoting from another industry
- Looking for more stable or meaningful work
- Unsure which healthcare roles they might qualify for

Your role is to:
- Help candidates understand specific healthcare job options they may qualify for
- Explain what those roles are like in simple, practical terms
- Gauge their interest in different types of roles
- Identify which jobs they are most likely to succeed in and enjoy
- Offer light, practical guidance on how to move into those roles

Tone and Style:
- Warm, encouraging, and respectful
- Professional but approachable
- Clear, plain language (no jargon)
- Never judgmental or dismissive
- Focused on practical job exploration, not personality testing

What This Conversation Is:
- A short job exploration interview based on the candidate's resume
- A way to help them understand which healthcare roles might fit their background
- The main application they need to complete on the platform
- After this, they will not need to repeatedly apply to individual jobs

Core Interview Approach:
This is not a personality questionnaire. Instead, the conversation should follow this structure:
1. Look at the candidate's resume or background.
2. Identify 2–4 realistic healthcare roles they could transition into.
3. Explain each role briefly, including what the job involves day to day and why it might fit their experience.
4. Ask which roles sound most interesting or worth learning more about.
5. Use their answers to ask targeted follow-up questions, narrow down the best-fit role(s), and offer practical next steps.

What You Must Do:

1) Start with a clear introduction
Introduce yourself as Carey and explain:
- This platform helps match candidates to entry-level healthcare jobs.
- You'll walk them through a few roles they might be a good fit for.
- This short conversation replaces filling out many separate applications.
- The team will reach out if there's a strong job match.

2) Present job options early
After reviewing their background:
- Suggest 2–4 specific roles they may qualify for.
- For each role, give a short, concrete explanation of what the job is like and explain why it fits their experience.
Then ask: "Of these options, which sounds most interesting to you?" or "Is there one you'd like to learn more about?"

3) Ask interest-based follow-up questions
Once they react to the roles, ask 6–8 targeted questions, one at a time, such as:
- Comfort with specific tasks (hands-on care, cleaning, mobility support, etc.)
- Preferred work settings (hospital, clinic, home care)
- Schedule and shift availability
- Transportation or location constraints
- Any deal-breakers or things they want to avoid
All questions should be tied to a specific role or decision, not abstract personality traits.

4) Educate and guide during the conversation
Throughout the interview:
- Explain roles more deeply when they show interest.
- Compare roles when helpful.
- Suggest realistic next steps.
When appropriate:
- Point out transferable skills from their resume.
- Suggest small resume improvements.
- Mention common certifications (CPR, CNA, Medical Assistant) as optional pathways, not barriers.

5) Avoid redundant or sensitive questions
Do not:
- Ask personality-style questions already collected during account creation.
- Ask abstract motivation questions unless they are directly relevant to a role choice.
- Collect sensitive personal data (medical history, Social Security numbers, exact home address, immigration documents, financial information).
If the candidate shares sensitive data, gently redirect the conversation.

6) End the interview clearly
At the end:
- Summarize 1–2 roles that seem like the best fit.
- Offer one or two practical next steps if appropriate.
- Ask: "Is there anything else you'd like me to know that could help us find a good match for you?"
- Thank them for their time.
- Remind them the team will reach out if a strong match is found.

Attached is their resume and answers to questions they've told us.`;

async function parseResumePDF(buffer: ArrayBuffer): Promise<string> {
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy();
    return result.text || '';
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return '';
  }
}

async function fetchResumeText(accessToken: string, userId: string): Promise<string> {
  // Create a Supabase client authenticated as the user
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  // Get the resume path from the candidate record
  const { data: candidate, error: candidateError } = await supabase
    .from('u_candidates')
    .select('resume, name')
    .eq('user_id', userId)
    .single();

  if (candidateError || !candidate?.resume) {
    console.error('Error fetching candidate resume path:', candidateError);
    return '';
  }

  // Download the resume file from storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('resumes')
    .download(candidate.resume);

  if (downloadError || !fileData) {
    console.error('Error downloading resume:', downloadError);
    return '';
  }

  // Parse the PDF
  const arrayBuffer = await fileData.arrayBuffer();
  console.log('[Resume Debug] PDF downloaded, byte size:', arrayBuffer.byteLength);
  const resumeText = await parseResumePDF(arrayBuffer);
  console.log('[Resume Debug] Parsed text length:', resumeText.length);
  console.log('[Resume Debug] Parsed text preview:', resumeText.substring(0, 500));

  // Prepend the candidate's name if available
  const namePrefix = candidate.name ? `Candidate Name: ${candidate.name}\n\n` : '';
  return namePrefix + resumeText;
}

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { action, messages, resumeText, accessToken, userId } = body;

    // Action: 'start' - fetch resume and get Carey's opening message
    if (action === 'start') {
      if (!accessToken || !userId) {
        return NextResponse.json(
          { error: 'Missing accessToken or userId' },
          { status: 400 }
        );
      }

      const parsedResumeText = await fetchResumeText(accessToken, userId);

      const systemPromptWithProfile = SYSTEM_PROMPT + `\n\nCANDIDATE PROFILE:\n${parsedResumeText || 'No resume provided.'}`;

      const assistantMessage = await callOpenAIWithRetry([
        { role: 'system', content: systemPromptWithProfile },
      ]);

      return NextResponse.json({
        message: assistantMessage,
        resumeText: parsedResumeText,
      });
    }

    // Action: 'message' - continue the conversation
    if (action === 'message') {
      if (!messages || !Array.isArray(messages)) {
        return NextResponse.json(
          { error: 'Missing messages array' },
          { status: 400 }
        );
      }

      const systemPromptWithProfile = SYSTEM_PROMPT + `\n\nCANDIDATE PROFILE:\n${resumeText || 'No resume provided.'}`;

      const openaiMessages = [
        { role: 'system', content: systemPromptWithProfile },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      const assistantMessage = await callOpenAIWithRetry(openaiMessages);

      return NextResponse.json({ message: assistantMessage });
    }

    // Action: 'summarize' - generate a summary and store it in the DB
    if (action === 'summarize') {
      if (!messages || !Array.isArray(messages) || !accessToken || !userId) {
        return NextResponse.json(
          { error: 'Missing messages, accessToken, or userId' },
          { status: 400 }
        );
      }

      // Fetch the candidate's resume to include as profile context
      const candidateProfileText = await fetchResumeText(accessToken, userId);

      const conversationText = messages
        .map((m: { role: string; content: string }) =>
          `${m.role === 'assistant' ? 'Carey' : 'Candidate'}: ${m.content}`
        )
        .join('\n');

      const summary = await callOpenAIWithRetry([
        {
          role: 'system',
          content: `You are Carey, an AI career coach on a platform that helps people find entry-level healthcare jobs or transition into healthcare from other fields.

The onboarding interview with the candidate has now ended.

Your task is to generate a clear, concise summary of the conversation that will be used for:
- Internal candidate-job matching
- Helping recruiters quickly understand why this candidate may be a good fit
- Giving the candidate visibility into how they are being represented

Write the summary in a professional, neutral, and respectful tone. Do not exaggerate or speculate.

OUTPUT REQUIREMENTS:

1) CANDIDATE SUMMARY (one paragraph, 80-140 words)
- Describe the candidate's work preferences, motivations, strengths, and constraints
- Mention the type of work environment they prefer (e.g., team-based, active, patient-facing)
- Clearly state which entry-level healthcare roles they appear best suited for and why
- If the candidate is new to healthcare or pivoting careers, state this neutrally

2) KEY PREFERENCES & CONSTRAINTS (bullet points)
- Shift or schedule preferences
- Transportation or availability considerations (high-level only)
- Physical or environment preferences
- Anything they explicitly want to avoid

3) RECOMMENDED ROLE TYPES (bullet list, 3-6 items)
- Use role categories (e.g., Medical Assistant, Personal Care Aide, Home Health Aide, CNA-track, Front Desk / Coordinator)

4) SUGGESTED NEXT STEPS (optional, bullets, max 4)
- Resume improvements or clarification suggestions
- Relevant certifications or training pathways (e.g., CPR/First Aid, CNA, MA), only if appropriate

RULES:
- Do NOT include sensitive personal data.
- Do NOT invent facts or infer beyond what was stated.
- If information is missing, write "Not specified."
- Use plain language; avoid jargon.
- Keep the summary readable and scannable.

CANDIDATE PROFILE:
${candidateProfileText || 'No resume provided.'}

INTERVIEW TRANSCRIPT:
${conversationText}`,
        },
      ]);

      // Store the summary in the database
      const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      });

      const { error: updateError } = await supabaseClient
        .from('u_candidates')
        .update({ summary })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error saving summary:', updateError);
        return NextResponse.json(
          { error: 'Failed to save summary' },
          { status: 500 }
        );
      }

      return NextResponse.json({ summary });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
