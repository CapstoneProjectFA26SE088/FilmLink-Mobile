import { z } from 'zod';
import { CatalogStatus } from '@/shared/domain';
import { PositiveIdSchema } from './common';

export const CatalogItemResponseSchema = z.object({
  id: PositiveIdSchema,
  code: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().nullable(),
  status: z.enum(CatalogStatus),
});
export type CatalogItemResponse = z.infer<typeof CatalogItemResponseSchema>;

export const FilmFormatResponseSchema = CatalogItemResponseSchema;
export type FilmFormatResponse = CatalogItemResponse;

export const FilmProcessResponseSchema = CatalogItemResponseSchema;
export type FilmProcessResponse = CatalogItemResponse;

export const ServiceTypeResponseSchema = CatalogItemResponseSchema;
export type ServiceTypeResponse = CatalogItemResponse;

export const FilmStockResponseSchema = z.object({
  id: PositiveIdSchema,
  stockName: z.string().min(1),
  manufacturer: z.string().min(1),
  iso: z.number().int().min(1).max(32_000),
  defaultFilmProcessId: PositiveIdSchema,
  defaultFilmProcessName: z.string().min(1),
  status: z.enum(CatalogStatus),
});
export type FilmStockResponse = z.infer<typeof FilmStockResponseSchema>;
