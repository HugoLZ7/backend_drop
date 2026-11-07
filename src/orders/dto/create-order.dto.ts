import { Type } from 'class-transformer';
import { CreatePackageDto } from './create-package.dto.js';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  pickupAddress: string;

  @IsDateString({ strict: true })
  scheduledDate: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  clientName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  clientLastName: string;

  @IsEmail()
  clientEmail: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  clientPhone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  deliveryAddress: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  department: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  areaCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  indications?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreatePackageDto)
  packages: CreatePackageDto[];
}
