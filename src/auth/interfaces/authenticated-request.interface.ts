import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    role: string;
    [key: string]: any; // Allow for other potential payload fields
  };
}
