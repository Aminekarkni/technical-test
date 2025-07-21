import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../../core/ApiError';

export enum ValidationSource {
  BODY = 'body',
  QUERY = 'query',
  PARAM = 'params',
}

export default (schema: any, source: ValidationSource = ValidationSource.BODY) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = schema[source] ? schema[source].validate(req[source]) : schema.validate(req[source]);
      if (!error) return next();

      const { details } = error;
      const message = details
        .map((i: any) => i.message.replace(/['"]+/g, ''))
        .join(',');
      next(new BadRequestError(message));
    } catch (error) {
      next(new BadRequestError('Invalid request'));
    }
  };
}; 