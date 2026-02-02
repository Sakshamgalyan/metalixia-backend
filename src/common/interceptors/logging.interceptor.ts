import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, body } = request;
        const now = Date.now();

        const handlerName = context.getHandler().name;
        const className = context.getClass().name;

        this.logger.log(
            `Incoming Request: [${method}] ${url} - Handler: ${className}.${handlerName}`,
        );

        // Optional: Log body for non-GET requests (be careful with sensitive data)
        if (method !== 'GET' && body && Object.keys(body).length > 0) {
            const sanitizedBody = { ...body };
            if (sanitizedBody.password) sanitizedBody.password = '***';
            if (sanitizedBody.token) sanitizedBody.token = '***';
            this.logger.debug(`Request Body: ${JSON.stringify(sanitizedBody)}`);
        }

        return next.handle().pipe(
            tap({
                next: (data) => {
                    const delay = Date.now() - now;
                    const response = context.switchToHttp().getResponse();
                    const statusCode = response.statusCode;
                    this.logger.log(
                        `Outgoing Response: [${method}] ${url} - Status: ${statusCode} - ${delay}ms`,
                    );
                },
                error: (error) => {
                    const delay = Date.now() - now;
                    this.logger.error(
                        `Request Failed: [${method}] ${url} - ${delay}ms - Error: ${error.message}`,
                    );
                },
            }),
        );
    }
}
