// Autentificare, validare si formatul unic al erorilor
import {
  ArgumentsHost, CanActivate, Catch, ExceptionFilter, ExecutionContext, HttpException, Injectable, PipeTransform, ValidationPipe,
} from '@nestjs/common';
import { SYMBOL_PATTERN } from './dto';

// Eroare API cu structura { error: { code, message } }
export class ApiError extends HttpException {
  constructor(status: number, code: string, message: string) {
    super({ error: { code, message } }, status);
  }
}

// Verificarea token-ului Bearer. NEIMPLEMENTAT: in productie se verifica semnatura JWT cu cheile JWKS
// ale Identity Provider-ului, iar proprietarul (sub) este preluat din token, niciodata din URL sau corp.
@Injectable()
export class BearerAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const header: string = req.headers['authorization'] || '';
    if (!header.startsWith('Bearer ') || header.length < 15) {
      throw new ApiError(401, 'unauthorized', 'a valid Bearer token is required');
    }
    req.userId = 'auth0|demo-user'; // provizoriu: ar fi claim-ul "sub" din token
    return true;
  }
}

// Validarea simbolului din cale
@Injectable()
export class SymbolPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const symbol = String(value || '').toUpperCase();
    if (!SYMBOL_PATTERN.test(symbol)) {
      throw new ApiError(400, 'invalid_symbol', 'symbol must be 1-10 uppercase letters, digits or dots');
    }
    return symbol;
  }
}

// ValidationPipe care transforma erorile in formatul comun (400 invalid_request)
export const validationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  exceptionFactory: errors => {
    const first = errors[0];
    const message = first && first.constraints ? Object.values(first.constraints)[0] : 'invalid request';
    const code = first && first.property === 'symbol' ? 'invalid_symbol' : 'invalid_request';
    return new ApiError(400, code, message);
  },
});

// Orice alta exceptie este adusa la aceeasi structura JSON
@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    if (exception instanceof HttpException) {
      const body: any = exception.getResponse();
      const status = exception.getStatus();
      if (body && body.error && body.error.code) return res.status(status).json(body);
      return res.status(status).json({ error: { code: status === 404 ? 'not_found' : 'http_error', message: String(body.message || exception.message) } });
    }
    return res.status(500).json({ error: { code: 'internal_error', message: 'unexpected server error' } });
  }
}
