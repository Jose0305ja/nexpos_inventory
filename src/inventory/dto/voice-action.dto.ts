import { IsNotEmpty, IsString } from 'class-validator';

export class VoiceActionDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  action: string;
}
