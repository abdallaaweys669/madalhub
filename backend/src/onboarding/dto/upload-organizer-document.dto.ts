import { IsString } from 'class-validator';

export class UploadOrganizerDocumentDto {
  @IsString()
  document_type!: string;
}
