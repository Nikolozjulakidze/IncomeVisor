import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { loadRates, convertFromUSD } from "../utils/currency.js";
import { formatCurrency } from "../utils/format.js";

// Hook that provides currency-aware formatting for USD-denominated amounts.
// It loads exchange rates once and exposes convertAmount + format.
export const useCurrency = () => {
  const { user } = useAuth();
  const currency = user?.currency || "USD";
  const [rates, setRates] = useState(null);

  useEffect(() => {
    let active = true;
    loadRates().then((r) => {
      if (active) setRates(r);
    });
    return () => {
      active = false;
    };
  }, []);

  // Convert a USD-stored amount into the display currency.
  const convertAmount = (amountUsd) =>
    convertFromUSD(amountUsd, currency, rates);

  // Format a USD-stored amount in the display currency (with conversion).
  const format = (amountUsd) =>
    formatCurrency(convertFromUSD(amountUsd, currency, rates), currency);

  return { currency, rates, convertAmount, format };
};
