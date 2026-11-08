import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { WebhooksController } from './webhooks.controller.js';

@Module({
  controllers: [OrdersController, WebhooksController],
  providers: [OrdersService],
})
export class OrdersModule {}
