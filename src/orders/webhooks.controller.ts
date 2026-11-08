import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrdersService } from './orders.service.js';
import { WebhookSecretGuard } from './webhook-secret.guard.js';

@UseGuards(WebhookSecretGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders/:orderNumber')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('orderNumber') orderNumber: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.markAsDelivered(orderNumber, dto);
  }
}
