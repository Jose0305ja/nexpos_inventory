import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    companyId?: string;
    user?: any;
  }
}
