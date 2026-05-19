import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export const SUPPORTED_CURRENCIES: Record<string, { symbol: string; name: string; decimals: number }> = {
  PHP: { symbol: '₱',  name: 'Philippine Peso',   decimals: 2 },
  USD: { symbol: '$',  name: 'US Dollar',          decimals: 2 },
  EUR: { symbol: '€',  name: 'Euro',               decimals: 2 },
  GBP: { symbol: '£',  name: 'British Pound',      decimals: 2 },
  JPY: { symbol: '¥',  name: 'Japanese Yen',       decimals: 0 },
  SGD: { symbol: 'S$', name: 'Singapore Dollar',   decimals: 2 },
  AUD: { symbol: 'A$', name: 'Australian Dollar',  decimals: 2 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar',    decimals: 2 },
  CNY: { symbol: '¥',  name: 'Chinese Yuan',       decimals: 2 },
  KRW: { symbol: '₩',  name: 'Korean Won',         decimals: 0 },
  THB: { symbol: '฿',  name: 'Thai Baht',          decimals: 2 },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit',  decimals: 2 },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah',  decimals: 0 },
  INR: { symbol: '₹',  name: 'Indian Rupee',       decimals: 2 },
  HKD: { symbol: 'HK$',name: 'Hong Kong Dollar',  decimals: 2 },
};

interface CurrencyContextType {
  currency:    string;                           // e.g. "USD"
  symbol:      string;                           // e.g. "$"
  rate:        number;                           // PHP → target rate
  rates:       Record<string, number>;           // all rates
  ratesLoaded: boolean;
  setCurrency: (code: string) => void;
  fmt:         (phpAmount: number | null | undefined) => string;
  convert:     (phpAmount: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({
  children,
  initialCurrency = 'PHP',
}: {
  children: ReactNode;
  initialCurrency?: string;
}) {
  const [currency, setCurrencyState] = useState(initialCurrency);
  const [rates, setRates]           = useState<Record<string, number>>({ PHP: 1 });
  const [ratesLoaded, setLoaded]    = useState(false);

  // Fetch live rates once on mount
  useEffect(() => {
    fetch('/api/currency/rates')
      .then(r => r.json())
      .then(data => {
        setRates(data.rates ?? { PHP: 1 });
        setLoaded(true);
      })
      .catch(() => setLoaded(true)); // fail silently — PHP = 1 fallback
  }, []);

  const setCurrency = (code: string) => {
    if (SUPPORTED_CURRENCIES[code]) setCurrencyState(code);
  };

  const rate   = rates[currency] ?? 1;
  const meta   = SUPPORTED_CURRENCIES[currency] ?? SUPPORTED_CURRENCIES['PHP'];
  const symbol = meta.symbol;

  const convert = (phpAmount: number) =>
    currency === 'PHP' ? phpAmount : phpAmount * rate;

  const fmt = (phpAmount: number | null | undefined): string => {
    if (phpAmount == null || isNaN(phpAmount)) return `${symbol}0`;
    const converted = convert(phpAmount);
    return `${symbol}${converted.toLocaleString('en-US', {
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{
      currency, symbol, rate, rates, ratesLoaded, setCurrency, fmt, convert
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
};
