import {
  Injectable,
  Logger,
  BadRequestException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Groq from "groq-sdk";
import { AssemblyAI, TranscriptUtterance } from "assemblyai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import {
  DEFAULT_LLM_MODEL,
  DEFAULT_LLM_TEMPERATURE,
  DEFAULT_LLM_MAX_TOKENS,
} from "src/utils/constants";
import { extractErrorMessage } from "src/utils/helpers";

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: Groq;
  private readonly model: string;
  private readonly assemblyAI?: AssemblyAI;

  constructor(private readonly configService: ConfigService) {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      throw new ServiceUnavailableException("GROQ_API_KEY is not configured");
    }

    this.client = new Groq({ apiKey: groqKey });
    this.model = process.env.LLM_MODEL || DEFAULT_LLM_MODEL;

    // AssemblyAI for transcription + speaker diarization
    const assemblyKey = process.env.ASSEMBLYAI_API_KEY;
    if (assemblyKey) {
      this.assemblyAI = new AssemblyAI({ apiKey: assemblyKey });
    }
  }

  async generateContent(prompt: string): Promise<string> {
    const startTime = Date.now();

    try {
      const completion = await this.client.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: DEFAULT_LLM_TEMPERATURE,
        max_tokens: DEFAULT_LLM_MAX_TOKENS,
      });

      const text = completion.choices[0]?.message?.content || "";
      const duration = Date.now() - startTime;
      this.logger.log(`LLM response received in ${duration}ms`);

      return text;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = extractErrorMessage(error);
      this.logger.error(`LLM API error after ${duration}ms: ${errorMessage}`);

      const status = this.getErrorStatus(error);

      if (status === 429) {
        throw new HttpException(
          "Rate limit exceeded. Please try again later.",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (status === 401) {
        throw new UnauthorizedException("Invalid API key configuration.");
      }

      throw new ServiceUnavailableException(
        "AI service temporarily unavailable. Please try again later.",
      );
    }
  }

  async generateJSON<T>(prompt: string): Promise<T> {
    const text = await this.generateContent(prompt);

    try {
      const cleanedText = this.extractJSON(text);
      return JSON.parse(cleanedText) as T;
    } catch {
      this.logger.error(
        `Failed to parse LLM response as JSON: ${text.substring(0, 500)}`,
      );

      throw new HttpException(
        "Failed to parse AI response. Please try again.",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async transcribeAudio(
    audioBuffer: Buffer,
    filename: string,
  ): Promise<{ text: string }> {
    if (!this.assemblyAI) {
      throw new ServiceUnavailableException("ASSEMBLYAI_API_KEY is not configured");
    }

    const startTime = Date.now();
    const tempPath = path.join(
      os.tmpdir(),
      `assemblyai-${Date.now()}-${filename}`,
    );

    this.logger.log(
      `Starting audio transcription with diarization: ${filename} (${audioBuffer.length} bytes)`,
    );

    fs.writeFileSync(tempPath, audioBuffer);

    try {
      const transcript = await this.assemblyAI.transcripts.transcribe({
        audio: tempPath,
        language_code: "pt",
        speaker_labels: true,
      });

      if (transcript.status === "error") {
        const errorMsg = transcript.error || "Unknown transcription error";
        this.logger.error(`AssemblyAI error: ${errorMsg}`);

        if (errorMsg.includes("audio")) {
          throw new BadRequestException("Audio file is invalid or corrupted");
        }
        throw new ServiceUnavailableException("Transcription service error");
      }

      const formatted = this.formatUtterances(transcript.utterances);

      const duration = Date.now() - startTime;
      this.logger.log(`Audio transcribed with diarization in ${duration}ms`);

      return { text: formatted };
    } catch (error: unknown) {
      if (
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      const duration = Date.now() - startTime;
      const errorMessage = extractErrorMessage(error);
      this.logger.error(
        `AssemblyAI API error after ${duration}ms: ${errorMessage}`,
      );

      throw new ServiceUnavailableException(
        "Transcription service temporarily unavailable. Please try again later.",
      );
    } finally {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  private formatUtterances(
    utterances: TranscriptUtterance[] | null | undefined,
  ): string {
    if (!utterances?.length) return "";

    // Keep neutral labels: Speaker A, Speaker B
    // The analysis pipeline will identify roles by CONTENT
    return utterances.map((u) => `Speaker ${u.speaker}: ${u.text}`).join("\n");
  }

  private extractJSON(text: string): string {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    // Try to find JSON object or array directly
    const directJsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (directJsonMatch) {
      return directJsonMatch[1].trim();
    }
    return text.trim();
  }

  private getErrorStatus(error: unknown): number | undefined {
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as Record<string, unknown>).status;
      return typeof status === "number" ? status : undefined;
    }
    return undefined;
  }
}
