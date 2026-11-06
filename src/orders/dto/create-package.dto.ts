import { IsNotEmpty, IsNumber, IsPositive, IsString, Max, MaxLength } from 'class-validator';

export class CreatePackageDto {
  @IsNumber()
  @IsPositive()
  @Max(500)
  length: number; 

  @IsNumber()
  @IsPositive()
  @Max(500)
  height: number; 

  @IsNumber()
  @IsPositive()
  @Max(500)
  width: number; 

  @IsNumber()
  @IsPositive()
  @Max(1000)
  weight: number; 

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  content: string;
}
