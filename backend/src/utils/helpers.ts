import { Logger, NotFoundException } from "@nestjs/common";
import { Repository, ObjectLiteral, FindOptionsWhere } from "typeorm";
import * as path from "path";
import { ALLOWED_AUDIO_EXTENSIONS } from "./constants";
import { Outcome } from "src/analyses/enums/outcome.enum";


export function extractErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    baseDelayMs?: number;
    logger?: Logger;
  },
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 2000;
  const logger = options?.logger;

  let lastError: Error = new Error("No attempts made");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === maxAttempts) break;

      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      logger?.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError;
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

export function isAudioFile(filename: string): boolean {
  return ALLOWED_AUDIO_EXTENSIONS.includes(getFileExtension(filename));
}

export function partitionByOutcome<T extends { outcome: Outcome }>(
  items: T[],
): { won: T[]; lost: T[] } {
  return {
    won: items.filter((t) => t.outcome === Outcome.WON),
    lost: items.filter((t) => t.outcome === Outcome.LOST),
  };
}

export async function findByIdOrThrow<T extends ObjectLiteral>(
  repository: Repository<T>,
  id: string,
  resourceName: string,
): Promise<T> {
  const entity = await repository.findOne({ where: { id } as unknown as FindOptionsWhere<T> });
  if (!entity) {
    throw new NotFoundException(`${resourceName} with ID ${id} not found`);
  }
  return entity;
}

// Helper to replace placeholders
export function buildPrompt(
  template: string,
  variables: Record<string, string>,
): string {
  let prompt = template;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return prompt;
}
