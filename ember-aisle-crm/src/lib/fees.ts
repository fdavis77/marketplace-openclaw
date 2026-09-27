import type { FeeStructure, Tier } from "./domain";
import type { Pence } from "./money";

export const PERCENT_FEE_RATE = 0.1;
export const PERCENT_FEE_MINIMUM: Pence = 5_500_00;

export type FeeInput = {
  tier: Tier;
  feeStructure: FeeStructure;
  /** Used for flat fees. */
  flatFee: Pence | null;
  /** The couple's overall wedding budget; drives the 10% fee. */
  weddingBudget: Pence | null;
  destinationSurcharge: Pence | null;
};

export type FeeResult =
  | { ok: true; baseFee: Pence; surcharge: Pence; totalFee: Pence; minimumApplied: boolean }
  | { ok: false; error: string };

/**
 * Tier 1 can be priced at 10% of the wedding budget with a £5,500 floor;
 * every other tier (and Tier 1 by choice) is a flat fee. The destination
 * surcharge is added on top of either.
 */
export function calculateFee(input: FeeInput): FeeResult {
  const surcharge = input.destinationSurcharge ?? 0;
  if (surcharge < 0) return { ok: false, error: "Destination surcharge can't be negative." };

  if (input.feeStructure === "percent_of_budget") {
    if (input.tier !== "full") {
      return { ok: false, error: "10%-of-budget pricing is only offered on Full Planning." };
    }
    if (input.weddingBudget === null || input.weddingBudget <= 0) {
      return { ok: false, error: "Enter the wedding budget to calculate a 10% fee." };
    }
    const percentFee = Math.round(input.weddingBudget * PERCENT_FEE_RATE);
    const minimumApplied = percentFee < PERCENT_FEE_MINIMUM;
    const baseFee = minimumApplied ? PERCENT_FEE_MINIMUM : percentFee;
    return { ok: true, baseFee, surcharge, totalFee: baseFee + surcharge, minimumApplied };
  }

  if (input.flatFee === null || input.flatFee < 0) {
    return { ok: false, error: "Enter the flat fee." };
  }
  return {
    ok: true,
    baseFee: input.flatFee,
    surcharge,
    totalFee: input.flatFee + surcharge,
    minimumApplied: false,
  };
}
