import { NestFactory } from '@nestjs/core';
import { AppModule } from '../backend/src/app.module';
import { Express } from 'express';

let cachedServer: Express;

export default async (req: any, res: any) => {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule);
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer(req, res);
};
