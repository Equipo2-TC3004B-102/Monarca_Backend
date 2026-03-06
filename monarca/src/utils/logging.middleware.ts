/**
 * FileName: logging.middleware.ts
 * Description: NestJS middleware for HTTP request logging. Logs the HTTP method,
 *              URL, status code, content length and response time for every
 *              incoming request.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const startTime = Date.now();

    // Listen for the finish event on the response to log after the request has been processed.
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const responseTime = Date.now() - startTime;
      console.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength || 0} - ${responseTime}ms`,
      );
    });

    next();
  }
}
