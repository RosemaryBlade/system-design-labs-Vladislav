// Exemple JSON realiste folosite in OpenAPI si de implementarile provizorii (stub)
export const priceAAPL = {
  symbol: 'AAPL', price: 189.3, currency: 'USD', changePct: 1.24,
  providerTime: '2026-11-17T14:45:00Z', freshness: 'fresh',
};
export const priceNVDA = {
  symbol: 'NVDA', price: 141.2, currency: 'USD', changePct: 3.85,
  providerTime: '2026-11-17T14:45:00Z', freshness: 'fresh',
};
export const priceTSLA = {
  symbol: 'TSLA', price: 352.5, currency: 'USD', changePct: 2.91,
  providerTime: '2026-11-17T14:28:00Z', freshness: 'delayed',
};

export const stockAAPL = { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology', latestPrice: priceAAPL };
export const stockNVDA = { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology', latestPrice: priceNVDA };
export const stockTSLA = { symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', latestPrice: priceTSLA };

export const stockPageFiltered = { items: [stockAAPL, stockNVDA], nextCursor: 'eyJzIjoiTlZEQSJ9' };
export const stockPageEmpty = { items: [], nextCursor: null };

export const trending = { items: [stockNVDA, stockTSLA, stockAAPL], asOf: '2026-11-17T14:28:00Z' };

export const overview = {
  region: 'us',
  indices: [
    { symbol: 'SPX', name: 'S&P 500', value: 5921.4, changePct: 0.42, providerTime: '2026-11-17T14:45:00Z' },
    { symbol: 'NDX', name: 'Nasdaq 100', value: 20876.1, changePct: 0.77, providerTime: '2026-11-17T14:45:00Z' },
  ],
  trending: [stockNVDA, stockTSLA, stockAAPL],
};

export const stockDetailAAPL = { ...stockAAPL, isin: 'US0378331005', active: true };

export const historyAAPL = {
  symbol: 'AAPL',
  points: [
    { date: '2026-11-13', open: 186.1, high: 188.0, low: 185.4, close: 187.2, volume: 48210000 },
    { date: '2026-11-14', open: 187.2, high: 190.1, low: 186.5, close: 189.3, volume: 51234000 },
  ],
};

export const watchlistOne = {
  items: [{ symbol: 'TSLA', name: 'Tesla, Inc.', addedAt: '2026-11-17T15:02:11Z', latestPrice: priceTSLA }],
  itemCount: 1,
  maxItems: 50,
};
export const watchlistEmpty = { items: [], itemCount: 0, maxItems: 50 };
export const watchlistItemTSLA = watchlistOne.items[0];

export const err = (code: string, message: string) => ({ error: { code, message } });
