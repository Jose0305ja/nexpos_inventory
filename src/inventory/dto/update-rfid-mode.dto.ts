import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class UpdateRfidModeDto {
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  enabled: boolean;
}
