// Rutele API v1. Implementarile sunt PROVIZORII (NEIMPLEMENTAT): returneaza exemplele din examples.ts,
// fara acces la baze de date. Scopul lor este sa defineasca contractul din care se genereaza OpenAPI.
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiOperation, ApiParam, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { ApiError, BearerAuthGuard, SymbolPipe } from './http';
import {
  AddWatchlistItemRequest, ErrorResponse, HistoryQuery, ListStocksQuery, MarketOverviewDto, OverviewQuery,
  PriceDto, PriceHistoryDto, StockDetailDto, StockPageDto, TrendingDto, TrendingQuery, WatchlistDto, WatchlistItemDto,
} from './dto';
import * as ex from './examples';

const errorExamples = (status: number, description: string, code: string, message: string) =>
  ApiResponse({ status, description, content: { 'application/json': { schema: { $ref: getSchemaPath(ErrorResponse) }, example: ex.err(code, message) } } });

// raspuns de succes: schema prin $ref + un exemplu sau mai multe exemple numite
const ok = (status: number, model: any, description: string, sample: { example?: any; examples?: Record<string, { summary: string; value: any }> }) =>
  ApiResponse({ status, description, content: { 'application/json': { schema: { $ref: getSchemaPath(model) }, ...sample } } });

const common = [
  errorExamples(401, 'Token lipsa, invalid sau expirat', 'unauthorized', 'a valid Bearer token is required'),
  errorExamples(429, 'Limita de frecventa depasita; vezi antetul Retry-After', 'rate_limited', 'too many requests, retry after 5 seconds'),
  errorExamples(503, 'Datele nu pot fi furnizate acum (stocare sau date mai vechi de 20 min)', 'unavailable', 'market data is temporarily unavailable'),
];
const ApplyCommon = () => (target: any, key?: any, desc?: any) => { common.forEach(d => d(target, key, desc)); };

@ApiExtraModels(ErrorResponse, MarketOverviewDto, StockPageDto, TrendingDto, StockDetailDto, PriceDto, PriceHistoryDto)
@ApiTags('market')
@ApiBearerAuth('bearerAuth')
@UseGuards(BearerAuthGuard)
@Controller({ path: 'v1' })
export class MarketController {
  @Get('market/overview')
  @ApiOperation({ summary: 'Overview-ul pietei: indici regionali si Stock-uri in tendinte', description: 'NEIMPLEMENTAT: returneaza un exemplu.' })
  @ok(200, MarketOverviewDto, 'Succes', { example: ex.overview })
  @errorExamples(400, 'Regiune invalida', 'invalid_region', 'region must be one of us, eu, asia')
  @ApplyCommon()
  overview(@Query() _q: OverviewQuery) {
    return ex.overview;
  }

  @Get('stocks')
  @ApiOperation({ summary: 'Rasfoieste, filtreaza si cauta Stock-uri', description: 'Pagina cu cursor; sortare implicita dupa simbol. NEIMPLEMENTAT: returneaza un exemplu.' })
  @ok(200, StockPageDto, 'Succes', { examples: {
      filtered: { summary: 'Pagina filtrata: sector=Technology&exchange=NASDAQ&limit=2', value: ex.stockPageFiltered },
      empty: { summary: 'Rezultat gol: q=zzzz', value: ex.stockPageEmpty },
    } })
  @errorExamples(400, 'Parametri invalizi (limit, minPrice > maxPrice, cursor)', 'invalid_request', 'limit must not be greater than 100')
  @ApplyCommon()
  list(@Query() q: ListStocksQuery) {
    if (q.q === 'zzzz') return ex.stockPageEmpty;
    return ex.stockPageFiltered;
  }

  @Get('stocks/trending')
  @ApiOperation({ summary: 'Stock-uri in tendinte', description: 'Ordonare: changePct descrescator, apoi volumul zilei descrescator, apoi simbol crescator. Doar Stock-uri active cu pret de cel mult 20 min. NEIMPLEMENTAT.' })
  @ok(200, TrendingDto, 'Succes', { example: ex.trending })
  @errorExamples(400, 'limit in afara intervalului 1-50', 'invalid_request', 'limit must not be greater than 50')
  @ApplyCommon()
  trending(@Query() _q: TrendingQuery) {
    return ex.trending;
  }

  @Get('stocks/:symbol')
  @ApiOperation({ summary: 'Detaliile unui Stock', description: 'NEIMPLEMENTAT: returneaza un exemplu.' })
  @ApiParam({ name: 'symbol', example: 'AAPL' })
  @ok(200, StockDetailDto, 'Succes', { example: ex.stockDetailAAPL })
  @errorExamples(400, 'Simbol invalid', 'invalid_symbol', 'symbol must be 1-10 uppercase letters, digits or dots')
  @errorExamples(404, 'Stock necunoscut', 'stock_not_found', 'no stock with symbol ZZZZ')
  @ApplyCommon()
  detail(@Param('symbol', SymbolPipe) symbol: string) {
    if (symbol === 'ZZZZ') throw new ApiError(404, 'stock_not_found', 'no stock with symbol ZZZZ');
    return ex.stockDetailAAPL;
  }

  @Get('stocks/:symbol/price')
  @ApiOperation({ summary: 'Ultimul pret acceptat', description: 'Citit din datele acceptate (cache/replica), fara cerere noua la furnizor. NEIMPLEMENTAT.' })
  @ApiParam({ name: 'symbol', example: 'AAPL' })
  @ok(200, PriceDto, 'Succes', { example: ex.priceAAPL })
  @errorExamples(400, 'Simbol invalid', 'invalid_symbol', 'symbol must be 1-10 uppercase letters, digits or dots')
  @errorExamples(404, 'Stock necunoscut', 'stock_not_found', 'no stock with symbol ZZZZ')
  @ApplyCommon()
  price(@Param('symbol', SymbolPipe) _symbol: string) {
    return ex.priceAAPL;
  }

  @Get('stocks/:symbol/history')
  @ApiOperation({ summary: 'Istoricul zilnic al preturilor', description: 'Interval inclusiv, maximum 366 de zile. NEIMPLEMENTAT.' })
  @ApiParam({ name: 'symbol', example: 'AAPL' })
  @ok(200, PriceHistoryDto, 'Succes', { example: ex.historyAAPL })
  @errorExamples(400, 'Interval invalid', 'invalid_range', 'from must be before to and the range at most 366 days')
  @errorExamples(404, 'Stock necunoscut', 'stock_not_found', 'no stock with symbol ZZZZ')
  @ApplyCommon()
  history(@Param('symbol', SymbolPipe) _symbol: string, @Query() q: HistoryQuery) {
    const days = (Date.parse(q.to) - Date.parse(q.from)) / 86400000;
    if (!(days >= 0 && days <= 366)) throw new ApiError(400, 'invalid_range', 'from must be before to and the range at most 366 days');
    return ex.historyAAPL;
  }
}

@ApiExtraModels(ErrorResponse, WatchlistDto, WatchlistItemDto)
@ApiTags('watchlist')
@ApiBearerAuth('bearerAuth')
@UseGuards(BearerAuthGuard)
@Controller({ path: 'v1/me/watchlist' })
export class WatchlistController {
  @Get()
  @ApiOperation({ summary: 'Citeste Watchlist-ul privat al Utilizatorului', description: 'Proprietarul este luat din token (sub). Citire de pe lider (Read-Your-Writes). NEIMPLEMENTAT.' })
  @ok(200, WatchlistDto, 'Succes', { examples: {
      one: { summary: 'Watchlist cu un element', value: ex.watchlistOne },
      empty: { summary: 'Watchlist gol', value: ex.watchlistEmpty },
    } })
  @ApplyCommon()
  get(@Req() _req: any) {
    return ex.watchlistOne;
  }

  @Post('items')
  @HttpCode(201)
  @ApiOperation({ summary: 'Adauga un Stock in Watchlist', description: 'Idempotent: daca simbolul exista deja, returneaza 200 cu elementul existent. NEIMPLEMENTAT.' })
  @ApiBody({ type: AddWatchlistItemRequest, examples: { tsla: { value: { symbol: 'TSLA' } } } })
  @ok(201, WatchlistItemDto, 'Adaugat', { example: ex.watchlistItemTSLA })
  @ApiResponse({ status: 200, description: 'Exista deja (idempotent)', type: WatchlistItemDto })
  @errorExamples(400, 'Simbol invalid', 'invalid_symbol', 'symbol must be 1-10 uppercase letters, digits or dots')
  @errorExamples(404, 'Stock necunoscut', 'stock_not_found', 'no stock with symbol ZZZZ')
  @errorExamples(409, 'Watchlist-ul are deja 50 de elemente', 'watchlist_full', 'watchlist already has 50 items')
  @ApplyCommon()
  add(@Body() body: AddWatchlistItemRequest) {
    if (body.symbol === 'ZZZZ') throw new ApiError(404, 'stock_not_found', 'no stock with symbol ZZZZ');
    return ex.watchlistItemTSLA;
  }

  @Delete('items/:symbol')
  @HttpCode(204)
  @ApiOperation({ summary: 'Elimina un Stock din Watchlist', description: 'Idempotent: 204 si daca simbolul nu era in lista. NEIMPLEMENTAT.' })
  @ApiParam({ name: 'symbol', example: 'TSLA' })
  @ApiResponse({ status: 204, description: 'Eliminat (sau nu exista)' })
  @errorExamples(400, 'Simbol invalid', 'invalid_symbol', 'symbol must be 1-10 uppercase letters, digits or dots')
  @ApplyCommon()
  remove(@Param('symbol', SymbolPipe) _symbol: string) {
    return;
  }
}
