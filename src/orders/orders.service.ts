import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto, userId: string) {
    const scheduledDate = this.parseScheduledDate(dto.scheduledDate);

    try {
      return await this.prisma.order.create({
        data: {
          //Spread trae toda la informacion del OrderDTO
          ...dto,
          scheduledDate,
          orderNumber: this.generateOrderNumber(),
          userId,
        },
      });
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
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
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
