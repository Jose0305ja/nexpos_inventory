import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VoiceCommandDto {
  @IsString()
  @IsNotEmpty()
  command: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}
