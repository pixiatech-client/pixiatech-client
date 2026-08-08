import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

const ALLOWED_MODELS = new Set([
  'gemini-3-flash-preview',
  'gemini-3.1-pro-preview',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.5-flash-preview-tts',
  'gemini-2.5-flash-image',
]);

interface GeminiRequest {
  model?: string;
  prompt: string;
  inlineData?: { data: string; mimeType: string };
  maxTokens?: number;
  responseMimeType?: string;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
  }

  let body: GeminiRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.prompt || typeof body.prompt !== 'string') {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
  }

  const model = body.model || 'gemini-3-flash-preview';
  if (!ALLOWED_MODELS.has(model)) {
    return NextResponse.json({ error: `Model not allowed: ${model}` }, { status: 400 });
  }

  if (body.inlineData && (!body.inlineData.data || !body.inlineData.mimeType)) {
    return NextResponse.json({ error: 'Invalid inlineData' }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const parts: any[] = [{ text: body.prompt }];
    if (body.inlineData) {
      parts.push({ inlineData: { data: body.inlineData.data, mimeType: body.inlineData.mimeType } });
    }

    const config: any = {};
    if (body.maxTokens) config.maxOutputTokens = body.maxTokens;
    if (body.responseMimeType) config.responseMimeType = body.responseMimeType;

    const result = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config,
    });

    return NextResponse.json({ text: result.text || '' });
  } catch (err: any) {
    console.error('[gemini] Error:', err);
    return NextResponse.json({ error: err?.message || 'Gemini API error' }, { status: 502 });
  }
}
