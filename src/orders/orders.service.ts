import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Order, Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { calculateSettlement, roundMoney } from './settlement.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto, userId: string) {
    const scheduledDate = this.parseScheduledDate(dto.scheduledDate);
    const shippingCost = await this.getShippingCost(scheduledDate);
    const isCod = dto.isCod ?? false;

    try {
      const order = await this.prisma.order.create({
        data: {
          //Spread trae toda la informacion del OrderDTO
          ...dto,
          scheduledDate,
          isCod,
          expectedAmount: isCod ? dto.expectedAmount : null,
          shippingCost,
          orderNumber: this.generateOrderNumber(),
          userId,
        },
      });
      return this.withSettlement(order);
    } catch (error) {
      const isDuplicateNumber =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002';
      if (isDuplicateNumber) {
        throw new ConflictException(
          'Se generó un número de orden repetido, intenta crear la orden de nuevo',
        );
      }
      throw error;
    }
  }

  async findAll(userId: string, query: FindOrdersQueryDto) {
    const { startDate, endDate, page, limit } = query;

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException(
        'La fecha inicial no puede ser mayor que la fecha final',
      );
    }

    const where: Prisma.OrderWhereInput = { userId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(
          `${startDate.slice(0, 10)}T00:00:00-06:00`,
        );
      }
      if (endDate) {
        where.createdAt.lte = new Date(
          `${endDate.slice(0, 10)}T23:59:59.999-06:00`,
        );
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: data.map((order) => this.withSettlement(order)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async markAsDelivered(orderNumber: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
    });
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }
    if (order.status === 'DELIVERED') {
      throw new ConflictException('La orden ya fue marcada como entregada');
    }

    const collectedAmount = order.isCod
      ? (dto.collectedAmount ?? order.expectedAmount)
      : null;

    const updated = await this.prisma.order.update({
      where: { orderNumber },
      data: { status: dto.status, collectedAmount, deliveredAt: new Date() },
    });
    return this.withSettlement(updated);
  }

  async getBalance(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      select: {
        isCod: true,
        status: true,
        shippingCost: true,
        collectedAmount: true,
      },
    });

    const balance = orders.reduce(
      (total, order) => total + calculateSettlement(order),
      0,
    );
    return { balance: roundMoney(balance) };
  }

  private withSettlement(order: Order) {
    return { ...order, settlement: calculateSettlement(order) };
  }

  private async getShippingCost(scheduledDate: Date) {
    const rate = await this.prisma.shippingRate.findUnique({
      where: { dayOfWeek: scheduledDate.getUTCDay() },
    });
    if (!rate) {
      throw new InternalServerErrorException(
        'No hay tarifa de envío configurada para ese día',
      );
    }
    return rate.cost;
  }

  //Crear el numero de orden random
  private generateOrderNumber(): string {
    return randomInt(1_000_000, 10_000_000).toString();
  }

  //Validador de fecha valida, debe ser hoy o fechas proximas
  private parseScheduledDate(value: string): Date {
    const day = value.slice(0, 10);
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/El_Salvador',
    });

    if (day < today) {
      throw new BadRequestException(
        'La fecha programada no puede ser anterior a hoy',
      );
    }

    return new Date(`${day}T12:00:00Z`);
  }
}
