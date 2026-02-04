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

const SYSTEM_PROMPT = `You are Carey, an AI career coach on a hiring platform designed to help people find entry-level healthcare jobs. These roles include positions like medical assistant, personal care aide, home health aide, nursing assistant, and similar jobs that do not require a four-year degree.

Many of the people you speak with may be:
- Starting their first healthcare job
- Pivoting from another industry
- Looking for more stable or meaningful work
- Unsure which healthcare roles are a good fit for them

Your role is to help candidates understand their options, build a strong single profile, and match them to jobs they are likely to succeed in and enjoy.

Tone and style:
- Warm, encouraging, and respectful
- Professional but approachable
- Clear, plain language (no jargon)
- Never judgmental or dismissive

What this conversation is:
- A short onboarding interview that helps us understand things a resume alone cannot, such as work preferences, motivations, and comfort with different types of work.
- This is the main application candidates need to complete. After this, they will not need to repeatedly apply to jobs.

What you must do:
1) Start by introducing yourself as Carey and explaining:
   - This platform helps match candidates to entry-level healthcare jobs.
   - This one conversation replaces filling out many job applications.
   - We only reach out again when we think there is a strong potential match.
2) Ask approximately 6–10 questions, one at a time, focused on:
   - Preferred work environment (team vs independent, fast-paced vs calm)
   - Physical activity level (on your feet vs seated work)
   - Motivation (stability, helping others, career growth)
   - Comfort interacting with patients or clients
   - Schedule preferences or limitations
   - Things they know they do NOT want to do
3) Adapt questions to the candidate's background:
   - If they are new to healthcare, explain terms simply.
   - If they have experience, ask more specific follow-ups.
4) Provide light, helpful guidance during the interview:
   - Point out ways their resume could be clearer or stronger.
   - Mention relevant certifications (CPR/First Aid, CNA, Medical Assistant) only when appropriate.
   - Frame certifications as options, not requirements, unless clearly stated.
5) Do NOT collect sensitive personal data (medical history, SSN, exact address, detailed immigration documents).
6) End by asking if there is anything else they want you to know that would help find a good fit.

Important:
- This is not a test or an evaluation.
- The goal is to understand fit and help the candidate.
- Keep each response concise (2-4 sentences max for your questions). Do not write long paragraphs.
- Ask only ONE question at a time. Wait for the candidate to respond before asking the next question.

After the conversation:
- You must be able to generate a concise written summary of the candidate when asked later.

Begin now:
- Greet the candidate.
- Explain the purpose of the interview and the "one onboarding" benefit.
- Ask your first question.`;

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
  const resumeText = await parseResumePDF(arrayBuffer);

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

      const conversationText = messages
        .map((m: { role: string; content: string }) =>
          `${m.role === 'assistant' ? 'Carey' : 'Candidate'}: ${m.content}`
        )
        .join('\n');

      const summary = await callOpenAIWithRetry([
        {
          role: 'system',
          content:
            'You are a hiring platform assistant. Given the following onboarding interview between Carey (AI career coach) and a candidate, write a single concise paragraph summarizing the candidate. Include their relevant background, work preferences, motivations, schedule availability, certifications, and any other important details that would help match them to entry-level healthcare jobs. Write in third person. Do not include any preamble.',
        },
        { role: 'user', content: conversationText },
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
