import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const questionText = formData.get('question') as string;
    const questionCategory = formData.get('category') as string;

    if (!audioFile || !questionText) {
      return NextResponse.json(
        { error: 'Audio file and question are required' },
        { status: 400 }
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

    // Step 2: Analyze the answer using GPT-4
    const analysisPrompt = `You are an expert interview coach. Analyze the following interview answer and provide detailed feedback.

**Interview Question (${questionCategory}):**
${questionText}

**Candidate's Answer (Transcript):**
${transcript}

**Word-level data from speech recognition:**
${JSON.stringify(words.map(w => ({ word: w.word, start: w.start, end: w.end })), null, 2)}

Please provide your analysis in the following JSON format:
{
  "overallRating": <number 1-10>,
  "ratingBreakdown": {
    "relevance": <number 1-10>,
    "clarity": <number 1-10>,
    "structure": <number 1-10>,
    "confidence": <number 1-10>,
    "completeness": <number 1-10>
  },
  "starMethodAnalysis": {
    "situation": { "present": <boolean>, "score": <number 1-10>, "feedback": "<string>" },
    "task": { "present": <boolean>, "score": <number 1-10>, "feedback": "<string>" },
    "action": { "present": <boolean>, "score": <number 1-10>, "feedback": "<string>" },
    "result": { "present": <boolean>, "score": <number 1-10>, "feedback": "<string>" }
  },
  "strengths": ["<string>", ...],
  "areasForImprovement": ["<string>", ...],
  "betterAnswer": "<A well-structured example of how to answer this question more effectively>",
  "pronunciationIssues": [
    {
      "word": "<the word as it appears in transcript>",
      "issue": "<description of the pronunciation issue>",
      "suggestion": "<how to pronounce it correctly>"
    }
  ],
  "fillerWords": [
    {
      "word": "<filler word like um, uh, like, you know>",
      "count": <number of occurrences>
    }
  ],
  "speakingPace": "<too fast, good, too slow>",
  "summary": "<2-3 sentence overall feedback>"
}

Important notes for pronunciation analysis:
- Look for words that might be unclear, mumbled, or commonly mispronounced
- Identify filler words (um, uh, like, you know, basically, actually) and count them
- Consider the speaking pace based on word timestamps
- Be constructive and helpful in your feedback

Return ONLY valid JSON, no markdown formatting.`;

    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert interview coach who provides detailed, constructive feedback on interview answers. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const analysisText = analysisResponse.choices[0]?.message?.content || '{}';

    // Parse the JSON response
    let analysis;
    try {
      // Remove any markdown code blocks if present
      const cleanedText = analysisText.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleanedText);
    } catch {
      console.error('Failed to parse analysis:', analysisText);
      return NextResponse.json(
        { error: 'Failed to parse AI analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transcript,
      words,
      analysis,
    });
  } catch (error) {
    console.error('Error analyzing answer:', error);
    return NextResponse.json(
      { error: 'Failed to analyze answer' },
      { status: 500 }
    );
  }
}
