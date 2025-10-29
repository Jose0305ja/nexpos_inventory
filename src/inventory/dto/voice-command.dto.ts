import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VoiceCommandDto {
  @IsString()
  @IsNotEmpty()
  command: string;
}

export class VoiceToActionDto {
  @IsString()
  @IsNotEmpty()
  voiceInput: string;

  @IsString()
  @IsOptional()
  locale?: string;
}
