/**
 * FileName: multer-error.filter.ts
 * Description: Global exception filter for handling Multer file upload errors,
 *              converting them to user-friendly HTTP responses.
 * Authors: Debug Studio Team
 * Last Modification made:
 * 04/05/2026 [Santiago Coronado Hernández] Added handling for specific Multer error codes to provide more detailed error messages.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { MulterError } from 'multer';
import { Response } from 'express';

@Catch(MulterError)
export class MulterErrorFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.BAD_REQUEST;
    let message = 'Error al procesar el archivo';

    // Handle specific multer error codes
    switch (exception.code) {
      case 'LIMIT_FILE_SIZE':
        status = HttpStatus.PAYLOAD_TOO_LARGE;
        message = 'El archivo es demasiado grande. El tamaño máximo permitido es 5 MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Demasiados archivos. Intenta de nuevo con fewer files.';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Demasiadas partes en el formulario.';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'El nombre del campo del formulario es demasiado largo.';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'El valor del campo del formulario es demasiado largo.';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Demasiados campos en el formulario.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Archivo no esperado.';
        break;
      default:
        message = exception.message || 'Error desconocido en la carga de archivo';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.code,
    });
  }
}
