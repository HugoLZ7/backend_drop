import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsIn(['DELIVERED'])
  status: 'DELIVERED';

  @IsOptional()
  @IsNumber()
  @Min(0)
  collectedAmount?: number;
}
