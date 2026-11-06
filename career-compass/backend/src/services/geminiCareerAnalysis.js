import { GoogleGenAI } from '@google/genai'
import { geminiApiKey, geminiModel } from '../config/env.js'
import { UpstreamServiceError } from '../errors.js'
import {
  createCareerAnalysisJsonSchema,
  careerAnalysisSystemInstruction,
  isCareerAnalysis,
} from './careerAnalysisContract.js'

let client

function getClient() {
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured.')
  }
  client ??= new GoogleGenAI({ apiKey: geminiApiKey })
  return client
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function generateWithRetry(client, prompt) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await client.models.generateContent({
        model: geminiModel,
        contents: `Student assessment:\n${JSON.stringify(prompt)}`,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: careerAnalysisSystemInstruction,
          responseJsonSchema: createCareerAnalysisJsonSchema(prompt.careerPathCount),
        },
      })
    } catch (error) {
      const retryable = [429, 500, 503, 504].includes(error.status)
      if (!retryable || attempt >= 2) throw error
      await wait(300 * (2 ** attempt))
    }
  }
}

export async function generateCareerAnalysis(assessment) {
  try {
    const response = await generateWithRetry(getClient(), assessment)
    const analysis = JSON.parse(response.text ?? '')
    if (!isCareerAnalysis(analysis, assessment.careerPathCount)) {
      throw new Error('Gemini returned a career analysis with an invalid structure.')
    }
    return analysis
  } catch (error) {
    throw new UpstreamServiceError('Gemini career analysis failed.', { cause: error })
  }
}
