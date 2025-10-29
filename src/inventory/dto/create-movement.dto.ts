import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateMovementDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsEnum(['in', 'out'])
  type: 'in' | 'out';

  @IsOptional()
  @IsString()
  reason?: string;
}
