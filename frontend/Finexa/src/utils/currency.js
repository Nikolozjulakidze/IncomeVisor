// Currency conversion utilities.
// The app stores amounts in USD as the base currency. This module converts
// USD-denominated amounts into the user's display currency.

const BASE = "USD";

// Static fallback rates (units of currency per 1 USD).
// Used when the live API is unreachable or the rate hasn't loaded yet.
const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.92,
  GEL: 2.61,
  GBP: 0.79,
  INR: 83.12,
  JPY: 149.5,
  CAD: 1.35,
  AUD: 1.51,
};

const CACHE_KEY = "finxa_currency_rates";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

let inFlightPromise = null;

// Load USD-based exchange rates from the free Frankfurter API.
// Returns a map of currencyCode -> rate (units per 1 USD).
export const loadRates = async () => {
  // Check cache first.
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (
      cached &&
      cached.timestamp &&
      Date.now() - cached.timestamp < CACHE_TTL
    ) {
      return cached.rates;
    }
  } catch {
    // ignore malformed cache
  }

  if (inFlightPromise) return inFlightPromise;

  inFlightPromise = (async () => {
    try {
      const res = await fetch(
        `https://api.frankfurter.app/latest?from=${BASE}`,
      );
      if (!res.ok) throw new Error("rate fetch failed");
      const data = await res.json();
      const rates = { ...FALLBACK_RATES, ...data.rates };
      // Ensure base is present.
      rates[BASE] = 1;
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), rates }),
        );
      } catch {
        // storage may be unavailable
      }
      return rates;
    } catch (err) {
      console.warn("Currency rates fetch failed, using fallback.", err);
      return FALLBACK_RATES;
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
};

// Convert a USD amount into the target currency.
export const convertFromUSD = (amountUsd, toCurrency = BASE, rates = null) => {
  const value = Number(amountUsd) || 0;
  const rate = rates?.[toCurrency] ?? FALLBACK_RATES[toCurrency] ?? 1;
  return value * rate;
};

// Get a single rate for a currency (units per 1 USD).
export const getRate = (currency = BASE, rates = null) =>
  rates?.[currency] ?? FALLBACK_RATES[currency] ?? 1;
