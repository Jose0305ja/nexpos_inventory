import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class UpdateRfidModeDto {
  @Transform(({ value }) => {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') {
        return true;
      }
      if (normalized === 'false') {
        return false;
      }
    }

    return Boolean(value);
  })
  @IsBoolean()
  entry_mode: boolean;
}
