import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const requestId = randomUUID();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error';

        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            requestId,
            message: typeof message === 'string' ? message : (message as any).message || message,
        };

        // Log the error to console
        this.logger.error(
            `${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`,
            exception instanceof Error ? exception.stack : undefined,
        );

        // Log to file for debugging
        if (status === 500) {
            try {
                const fs = require('fs');
                const logEntry = `
[${errorResponse.timestamp}] Request ID: ${requestId}
Method: ${request.method}
URL: ${request.url}
User: ${JSON.stringify((request as any).user || 'No user')}
Body: ${JSON.stringify(request.body || {})}
Status: ${status}
Message: ${JSON.stringify(message)}
Stack: ${exception instanceof Error ? exception.stack : 'No stack trace'}
----------------------------------------
`;
                fs.appendFileSync('error_log.txt', logEntry);
            } catch (fsError) {
                console.error('Failed to write to error log file', fsError);
            }
        }

        response.status(status).json(errorResponse);
    }
}
