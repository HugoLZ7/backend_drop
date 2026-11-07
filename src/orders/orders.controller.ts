import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthRequest } from '../auth/interfaces/auth-request.interface.js';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: AuthRequest) {
    return this.ordersService.create(createOrderDto, req.user.userId);
  }

  @Get()
  findAll(@Query() query: FindOrdersQueryDto, @Req() req: AuthRequest) {
    return this.ordersService.findAll(req.user.userId, query);
  }
}
