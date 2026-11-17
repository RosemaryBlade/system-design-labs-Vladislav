// Lab 4 — demonstrarea traseului cache-ului Redis prin redis-cli (Redis 5.0.14 local, 127.0.0.1:6379)
// Ruleaza: node redis-demo.js   (redis-cli trebuie sa fie in PATH sau in REDIS_CLI)
const { execFileSync } = require('child_process');
const fs = require('fs');
const LOCAL = 'C:/Users/smile/OneDrive/Desktop/university/_tools/redis/bin/redis-cli.exe';
const CLI = process.env.REDIS_CLI || (fs.existsSync(LOCAL) ? LOCAL : 'redis-cli');

function cli(...args) {
  const shown = args.map(a => (/[\s"{}]/.test(a) ? `'${a}'` : a)).join(' ');
  console.log(`127.0.0.1:6379> ${shown}`);
  const out = execFileSync(CLI, args, { encoding: 'utf8' }).replace(/\r/g, '').trimEnd();
  console.log(out === '' ? '(nil)' : out);
}

const now = new Date();
const iso = d => d.toISOString().replace(/\.\d{3}Z$/, 'Z');

// ---------------- Caz 1: pretul unui Stock ----------------
console.log('=== Caz 1: pretul Actiunii AAPL ===');
cli('DEL', 'price:v1:AAPL');                       // pornim de la un cache gol pentru demonstratie
cli('GET', 'price:v1:AAPL');                       // 1. valoarea lipseste
// 2. sursa durabila (Market Data Store) a returnat: AAPL 189.30, provider_time cu 15 min in urma
const priceValue = JSON.stringify({
  symbol: 'AAPL', price: 189.30, currency: 'USD', changePct: 1.24,
  providerTime: iso(new Date(now - 15 * 60 * 1000)),   // momentul furnizorului (sursa)
  cachedAt: iso(now),                                    // momentul completarii cache-ului
});
cli('SET', 'price:v1:AAPL', priceValue, 'EX', '60');
cli('GET', 'price:v1:AAPL');                       // 3. valoarea este gasita
cli('TTL', 'price:v1:AAPL');

// ---------------- Caz 2: Overview-ul pietei ----------------
console.log('\n=== Caz 2: Overview pentru piata US ===');
cli('DEL', 'overview:v1:us');
cli('GET', 'overview:v1:us');
const overviewValue = JSON.stringify({
  region: 'us',
  indices: [
    { symbol: 'SPX', value: 5921.4, changePct: 0.42 },
    { symbol: 'NDX', value: 20876.1, changePct: 0.77 },
  ],
  trending: ['NVDA', 'TSLA', 'AAPL'],
  providerTime: iso(new Date(now - 15 * 60 * 1000)),
  cachedAt: iso(now),
});
cli('SET', 'overview:v1:us', overviewValue, 'EX', '300');
cli('GET', 'overview:v1:us');
cli('TTL', 'overview:v1:us');

// ---------------- Persistenta Redis ----------------
console.log('\n=== Persistenta: fara RDB si fara AOF ===');
cli('CONFIG', 'GET', 'save');
cli('CONFIG', 'GET', 'appendonly');
