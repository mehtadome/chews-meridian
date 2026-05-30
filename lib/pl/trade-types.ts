import { z } from "zod";

export type AssetType = "stock" | "option" | "future";
export type Direction = "long" | "short";

export interface Trade {
  id: string;
  symbol: string;
  assetType: AssetType;
  direction: Direction;
  entryPrice: number;
  entryDate: string;
  exitPrice: number | null;
  exitDate: string | null;
  quantity: number;
  multiplier: number;
  notes: string;
  markPrice: number | null;
}

export const TradeCreateSchema = z.object({
  symbol: z.string().min(1),
  assetType: z.enum(["stock", "option", "future"]),
  direction: z.enum(["long", "short"]),
  entryPrice: z.number().positive(),
  entryDate: z.string().min(1),
  exitPrice: z.number().positive().nullable(),
  exitDate: z.string().min(1).nullable(),
  quantity: z.number().positive(),
  multiplier: z.number().positive(),
  notes: z.string(),
  markPrice: z.number().positive().nullable(),
});

export const TradeUpdateSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1).optional(),
  assetType: z.enum(["stock", "option", "future"]).optional(),
  direction: z.enum(["long", "short"]).optional(),
  entryPrice: z.number().positive().optional(),
  entryDate: z.string().min(1).optional(),
  exitPrice: z.number().positive().nullable().optional(),
  exitDate: z.string().min(1).nullable().optional(),
  quantity: z.number().positive().optional(),
  multiplier: z.number().positive().optional(),
  notes: z.string().optional(),
  markPrice: z.number().positive().nullable().optional(),
});

export type TradeCreate = z.infer<typeof TradeCreateSchema>;
export type TradeUpdate = z.infer<typeof TradeUpdateSchema>;
