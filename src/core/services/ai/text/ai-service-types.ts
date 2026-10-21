/**
 * AI Service Types — compatibility re-export shim
 *
 * Canonical definitions moved to @/types/ai. This file is kept so that
 * existing relative-path consumers (ai-call-dispatcher, ai-service,
 * ai-stream, ai-mock-data, ai-cache) and the barrel index.ts continue
 * to resolve without changes.
 *
 * @deprecated Import from '@/core/ai/types/ai-core' in new code.
 */

export * from '@/core/ai/types/ai-core';
