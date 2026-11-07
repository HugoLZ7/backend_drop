import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

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

  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: string) {
    return `This action returns a #${id} order`;
  }

  //Crear el numero de orden random
  private generateOrderNumber(): string {
    return randomInt(1_000_000, 10_000_000).toString();
  }

  //Validador de fecha valida, debe ser hoy o fexhas proximas
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
