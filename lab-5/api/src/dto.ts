// Modelele API (camelCase) pentru Personal Investment Dashboard — Lab 5
// Campurile stocate sunt snake_case in modelul de date; aici sunt forma lor pentru client.
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, IsISO8601 } from 'class-validator';

export const SYMBOL_PATTERN = /^[A-Z][A-Z0-9.]{0,9}$/;

// ---------------------------------------------------------------- Erori
export class ErrorBody {
  @ApiProperty({ example: 'invalid_symbol', description: 'Cod stabil, folosit de client pentru a alege comportamentul' })
  code: string;

  @ApiProperty({ example: 'symbol must be 1-10 uppercase letters, digits or dots', description: 'Explicatie pentru om' })
  message: string;
}

export class ErrorResponse {
  @ApiProperty({ type: ErrorBody })
  error: ErrorBody;
}

// ---------------------------------------------------------------- Date de piata
export type Freshness = 'fresh' | 'delayed';

export class PriceDto {
  @ApiProperty({ example: 'AAPL' })
  symbol: string;

  @ApiProperty({ example: 189.3, description: 'Ultimul pret acceptat' })
  price: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: 1.24, description: 'Schimbarea procentuala fata de inchiderea anterioara' })
  changePct: number;

  @ApiProperty({ example: '2026-11-17T14:45:00Z', description: 'Momentul observatiei furnizorului (provider_time)' })
  providerTime: string;

  @ApiProperty({ enum: ['fresh', 'delayed'], example: 'fresh', description: 'Derivat: fresh <= 15 min, delayed 15-20 min. Peste 20 min se returneaza 503.' })
  freshness: Freshness;
}

export class StockSummaryDto {
  @ApiProperty({ example: 'AAPL' })
  symbol: string;

  @ApiProperty({ example: 'Apple Inc.' })
  name: string;

  @ApiProperty({ example: 'NASDAQ' })
  exchange: string;

  @ApiProperty({ example: 'Technology' })
  sector: string;

  @ApiPropertyOptional({ type: PriceDto, nullable: true, description: 'null daca nu exista un pret acceptat de cel mult 20 min' })
  latestPrice: PriceDto | null;
}

export class StockDetailDto extends StockSummaryDto {
  @ApiProperty({ example: 'US0378331005', nullable: true, description: 'null daca furnizorul nu are ISIN' })
  isin: string | null;

  @ApiProperty({ example: true, description: 'false pentru Stock-uri delistate, pastrate pentru istoric' })
  active: boolean;
}

export class StockPageDto {
  @ApiProperty({ type: [StockSummaryDto] })
  items: StockSummaryDto[];

  @ApiProperty({ example: 'eyJzIjoiQUFQTCJ9', nullable: true, description: 'Cursor opac pentru pagina urmatoare; null daca nu mai exista rezultate' })
  nextCursor: string | null;
}

export class TrendingDto {
  @ApiProperty({ type: [StockSummaryDto], description: 'Ordonate dupa changePct descrescator, apoi volum descrescator, apoi simbol' })
  items: StockSummaryDto[];

  @ApiProperty({ example: '2026-11-17T14:45:00Z', description: 'Cel mai vechi providerTime din lista' })
  asOf: string;
}

export class IndexCardDto {
  @ApiProperty({ example: 'SPX' })
  symbol: string;

  @ApiProperty({ example: 'S&P 500' })
  name: string;

  @ApiProperty({ example: 5921.4 })
  value: number;

  @ApiProperty({ example: 0.42 })
  changePct: number;

  @ApiProperty({ example: '2026-11-17T14:45:00Z' })
  providerTime: string;
}

export class MarketOverviewDto {
  @ApiProperty({ example: 'us' })
  region: string;

  @ApiProperty({ type: [IndexCardDto] })
  indices: IndexCardDto[];

  @ApiProperty({ type: [StockSummaryDto], description: 'Primele 5 Stock-uri in tendinte' })
  trending: StockSummaryDto[];
}

export class DailyPriceDto {
  @ApiProperty({ example: '2026-11-14', description: 'Ziua de tranzactionare (ora bursei)' })
  date: string;

  @ApiProperty({ example: 187.2 }) open: number;
  @ApiProperty({ example: 190.1 }) high: number;
  @ApiProperty({ example: 186.5 }) low: number;
  @ApiProperty({ example: 189.3 }) close: number;
  @ApiProperty({ example: 51234000 }) volume: number;
}

export class PriceHistoryDto {
  @ApiProperty({ example: 'AAPL' })
  symbol: string;

  @ApiProperty({ type: [DailyPriceDto], description: 'Ordonat crescator dupa data' })
  points: DailyPriceDto[];
}

// ---------------------------------------------------------------- Watchlist
export class WatchlistItemDto {
  @ApiProperty({ example: 'TSLA' })
  symbol: string;

  @ApiProperty({ example: 'Tesla, Inc.' })
  name: string;

  @ApiProperty({ example: '2026-11-17T15:02:11Z', description: 'Momentul adaugarii (controlat de server)' })
  addedAt: string;

  @ApiPropertyOptional({ type: PriceDto, nullable: true })
  latestPrice: PriceDto | null;
}

export class WatchlistDto {
  @ApiProperty({ type: [WatchlistItemDto], description: 'Ordonate dupa addedAt descrescator' })
  items: WatchlistItemDto[];

  @ApiProperty({ example: 1, description: 'Derivat: numarul de elemente (maximum 50)' })
  itemCount: number;

  @ApiProperty({ example: 50 })
  maxItems: number;
}

// Model de intrare: doar campuri controlate de client (fara addedAt, owner etc.)
export class AddWatchlistItemRequest {
  @ApiProperty({ example: 'TSLA', description: '1-10 caractere: litere mari, cifre sau punct' })
  @IsString()
  @Matches(SYMBOL_PATTERN, { message: 'symbol must be 1-10 uppercase letters, digits or dots' })
  symbol: string;
}

// ---------------------------------------------------------------- Parametri de interogare
export class ListStocksQuery {
  @ApiPropertyOptional({ example: 'appl', description: 'Cautare dupa nume sau simbol (2-50 caractere)' })
  @IsOptional() @IsString() @MinLength(2) @MaxLength(50)
  q?: string;

  @ApiPropertyOptional({ example: 'Technology', description: 'Filtru dupa sector' })
  @IsOptional() @IsString() @MaxLength(50)
  sector?: string;

  @ApiPropertyOptional({ enum: ['NASDAQ', 'NYSE', 'AMEX'], example: 'NASDAQ' })
  @IsOptional() @IsIn(['NASDAQ', 'NYSE', 'AMEX'])
  exchange?: string;

  @ApiPropertyOptional({ example: 50, minimum: 0, description: 'Pret minim in USD' })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 500, minimum: 0, description: 'Pret maxim in USD' })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ['symbol', 'name', '-changePct'], default: 'symbol' })
  @IsOptional() @IsIn(['symbol', 'name', '-changePct'])
  sort?: string = 'symbol';

  @ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Cursor opac primit in nextCursor' })
  @IsOptional() @IsString()
  cursor?: string;
}

export class TrendingQuery {
  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 50 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limit?: number = 10;
}

export class OverviewQuery {
  @ApiPropertyOptional({ enum: ['us', 'eu', 'asia'], default: 'us' })
  @IsOptional() @IsIn(['us', 'eu', 'asia'])
  region?: string = 'us';
}

export class HistoryQuery {
  @ApiProperty({ example: '2026-10-17', description: 'Data de inceput (inclusiv), YYYY-MM-DD' })
  @IsISO8601({ strict: true })
  from: string;

  @ApiProperty({ example: '2026-11-14', description: 'Data de sfarsit (inclusiv), maximum 366 zile dupa from' })
  @IsISO8601({ strict: true })
  to: string;
}
