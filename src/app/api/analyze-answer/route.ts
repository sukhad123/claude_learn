import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper to calculate speaking stats from word timestamps
function calculateSpeakingStats(words: Array<{ word: string; start: number; end: number }>) {
  if (words.length < 2) return { wordsPerMinute: 0, totalDuration: 0 };

  const totalDuration = words[words.length - 1].end - words[0].start;
  const wordsPerMinute = totalDuration > 0 ? Math.round((words.length / totalDuration) * 60) : 0;

  return { wordsPerMinute, totalDuration: Math.round(totalDuration) };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const questionText = formData.get('question') as string;
    const questionCategory = formData.get('category') as string;

    if (!audioFile || !questionText) {
      return new Response(
        JSON.stringify({ error: 'Audio file and question are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Transcribe audio using Whisper API with word-level timestamps
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
      language: 'en',
    });

    const transcript = transcriptionResponse.text;
    const words = transcriptionResponse.words || [];
    const speakingStats = calculateSpeakingStats(words);

    // Step 2: Stream the analysis using GPT-4o-mini
    const analysisPrompt = `Analyze this interview answer and provide feedback.

**Question (${questionCategory}):** ${questionText}

**Answer:** ${transcript}

**Speaking stats:** ${speakingStats.wordsPerMinute} words/min, ${speakingStats.totalDuration}s duration

Respond with JSON:
{
  "overallRating": <1-10>,
  "ratingBreakdown": {
    "relevance": <1-10>,
    "clarity": <1-10>,
    "structure": <1-10>,
    "confidence": <1-10>,
    "completeness": <1-10>
  },
  "starMethodAnalysis": {
    "situation": { "present": <bool>, "score": <1-10>, "feedback": "<string>" },
    "task": { "present": <bool>, "score": <1-10>, "feedback": "<string>" },
    "action": { "present": <bool>, "score": <1-10>, "feedback": "<string>" },
    "result": { "present": <bool>, "score": <1-10>, "feedback": "<string>" }
  },
  "strengths": ["<string>"],
  "areasForImprovement": ["<string>"],
  "betterAnswer": "<improved answer example>",
  "fillerWords": [{ "word": "<filler>", "count": <n> }],
  "speakingPace": "<too fast|good|too slow>",
  "summary": "<2-3 sentence feedback>"
}`;

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert interview coach. Respond with valid JSON only.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      stream: true,
    });

    // Create a streaming response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        // First, send the transcript immediately
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'transcript',
          transcript,
          words,
          speakingStats
        }) + '\n'));

        // Then stream the analysis
        let analysisText = '';
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          analysisText += content;

          // Send partial updates
          if (content) {
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'analysis_chunk',
              content
            }) + '\n'));
          }
        }

        // Send the final parsed analysis
        try {
          const analysis = JSON.parse(analysisText);
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'analysis_complete',
            analysis
          }) + '\n'));
        } catch {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'error',
            error: 'Failed to parse analysis'
          }) + '\n'));
        }

        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error analyzing answer:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to analyze answer' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
