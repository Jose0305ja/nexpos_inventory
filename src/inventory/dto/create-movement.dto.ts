import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateMovementDto {
  @IsUUID()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsIn(['in', 'out'])
  type: 'in' | 'out';

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}
