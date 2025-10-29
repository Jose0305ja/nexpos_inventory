import { IsNotEmpty, IsString } from 'class-validator';

export class VoiceCommandDto {
  @IsString()
  @IsNotEmpty()
  command: string;
}
