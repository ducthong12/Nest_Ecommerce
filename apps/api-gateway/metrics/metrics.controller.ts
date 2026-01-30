import { Controller, Get, Res, VERSION_NEUTRAL } from '@nestjs/common';
import { Response } from 'express';
import { register } from 'prom-client';

@Controller({
  path: 'metrics',
  version: VERSION_NEUTRAL,
})
export class MetricsController {
  @Get()
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  }
}
