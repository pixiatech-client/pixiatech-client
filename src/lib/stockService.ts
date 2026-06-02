/**
 * stockService.ts
 * Rental stock availability engine.
 *
 * Strategy: Day-by-day peak analysis
 * For each day in [targetStart, targetEnd], sum the number of tiles booked by
 * all accepted rentals whose period overlaps that day.  If the maximum daily
 * usage + neededTiles <= totalStock, the slot is available.
 *
 * "Accepted rentals" = quotes with status 'rented' stored in Firestore.
 */

import { getFirebaseAdmin } from './firebase-admin';

/** Normalise a date to midnight UTC so day comparisons are reliable. */
function toMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** Number of tiles needed for a given screen size. Cabinet = 50 cm × 50 cm. */
export function calcTilesNeeded(widthM: number, heightM: number, quantity: number = 1): number {
  const CABINET_SIZE_M = 0.5;
  return Math.ceil(widthM / CABINET_SIZE_M) * Math.ceil(heightM / CABINET_SIZE_M) * quantity;
}

export interface RentalQuote {
  id: string;
  from: Date;
  to: Date;
  /** Total dalles (cabinets) for ALL products in this quote */
  tiles: number;
}

export interface StockCheckResult {
  available: boolean;
  neededTiles: number;
  totalStock: number;
  /** Maximum usage across the requested window (excluding this booking) */
  peakUsage: number;
  availableTiles: number;
  /** First date window (same duration) that has enough stock, or null if all clear */
  nextAvailableDate: Date | null;
}

/**
 * Fetch all confirmed rental quotes from Firestore.
 * These are quotes whose `status === 'rented'`.
 * We call this server-side via the Admin SDK.
 */
async function fetchActiveRentals(excludeQuoteId?: string): Promise<RentalQuote[]> {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return [];

  try {
    const snap = await adminDb
      .collection('quotes')
      .where('status', '==', 'rented')
      .get();

    const results: RentalQuote[] = [];

    snap.forEach((doc) => {
      if (excludeQuoteId && doc.id === excludeQuoteId) return;
      const data = doc.data();
      const products: any[] = data.products || [];

      // Sum all tiles across all rental products in this quote
      let tiles = 0;
      for (const p of products) {
        if (p.transactionType === 'rental' && p.rentalPeriod) {
          const tileW = (p.tileWidth || 50) / 100; // cm → m
          const tileH = (p.tileHeight || 50) / 100;
          const cabW = Math.ceil((p.width || 1) / tileW);
          const cabH = Math.ceil((p.height || 1) / tileH);
          tiles += cabW * cabH * (p.quantity || 1);
        }
      }
      if (tiles === 0) return; // Skip if no rental products

      // Determine the overall rental period (union of all product periods)
      let from: Date | null = null;
      let to: Date | null = null;
      for (const p of products) {
        if (p.rentalPeriod) {
          const pFrom = p.rentalPeriod.from?.toDate?.() ?? new Date(p.rentalPeriod.from);
          const pTo = p.rentalPeriod.to?.toDate?.() ?? new Date(p.rentalPeriod.to);
          if (!from || pFrom < from) from = pFrom;
          if (!to || pTo > to) to = pTo;
        }
      }
      if (!from || !to) return;

      results.push({ id: doc.id, from, to, tiles });
    });

    return results;
  } catch (e) {
    console.error('[stockService] fetchActiveRentals error:', e);
    return [];
  }
}

/**
 * Compute peak tile usage for each day in [start, end] across all existing rentals.
 */
function computeDailyUsage(
  start: Date,
  end: Date,
  activeRentals: RentalQuote[]
): Map<string, number> {
  const usage = new Map<string, number>();
  const cur = new Date(toMidnight(start));
  const endDay = toMidnight(end);

  while (cur <= endDay) {
    const key = cur.toISOString().slice(0, 10);
    let daily = 0;
    for (const r of activeRentals) {
      const rStart = toMidnight(r.from);
      const rEnd = toMidnight(r.to);
      if (cur >= rStart && cur <= rEnd) {
        daily += r.tiles;
      }
    }
    usage.set(key, daily);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return usage;
}

/**
 * Find the next date window (same number of days as targetStart→targetEnd)
 * where availableStock >= neededTiles.
 * Searches forward for up to 365 days.
 */
function findNextAvailableDate(
  targetStart: Date,
  targetEnd: Date,
  neededTiles: number,
  totalStock: number,
  activeRentals: RentalQuote[]
): Date | null {
  const durationMs = toMidnight(targetEnd).getTime() - toMidnight(targetStart).getTime();
  const today = toMidnight(new Date());
  let candidate = new Date(Math.max(toMidnight(targetStart).getTime(), today.getTime()));
  candidate.setUTCDate(candidate.getUTCDate() + 1); // start searching from the day after

  for (let i = 0; i < 365; i++) {
    const candidateEnd = new Date(candidate.getTime() + durationMs);
    const usage = computeDailyUsage(candidate, candidateEnd, activeRentals);
    const peak = Math.max(...Array.from(usage.values()), 0);
    if (peak + neededTiles <= totalStock) {
      return candidate;
    }
    candidate = new Date(candidate.getTime() + 86_400_000); // +1 day
  }
  return null;
}

/**
 * Main API: check if a given rental window is available.
 *
 * @param startDate   - Start of the desired rental period
 * @param endDate     - End of the desired rental period
 * @param neededTiles - Number of 50 cm × 50 cm tiles required
 * @param totalStock  - Total tiles available in warehouse (from settings)
 * @param excludeQuoteId - Exclude a specific quote (e.g. when editing)
 */
export async function checkStockAvailability(
  startDate: Date,
  endDate: Date,
  neededTiles: number,
  totalStock: number,
  excludeQuoteId?: string
): Promise<StockCheckResult> {
  const activeRentals = await fetchActiveRentals(excludeQuoteId);
  const usage = computeDailyUsage(startDate, endDate, activeRentals);
  const peakUsage = Math.max(...Array.from(usage.values()), 0);
  const availableTiles = Math.max(0, totalStock - peakUsage);
  const available = peakUsage + neededTiles <= totalStock;

  let nextAvailableDate: Date | null = null;
  if (!available) {
    nextAvailableDate = findNextAvailableDate(
      startDate,
      endDate,
      neededTiles,
      totalStock,
      activeRentals
    );
  }

  return {
    available,
    neededTiles,
    totalStock,
    peakUsage,
    availableTiles,
    nextAvailableDate,
  };
}
