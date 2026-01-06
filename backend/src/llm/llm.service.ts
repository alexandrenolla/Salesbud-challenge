import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ServiceUnavailableException,
} from "@nestjs/common";
import Groq from "groq-sdk";

import {
  DEFAULT_LLM_MODEL,
  DEFAULT_LLM_TEMPERATURE,
  DEFAULT_LLM_MAX_TOKENS,
} from "src/utils/constants";

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: Groq;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("GROQ_API_KEY");
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    this.client = new Groq({ apiKey });
    this.model = this.configService.get<string>("LLM_MODEL") || DEFAULT_LLM_MODEL;
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
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
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
