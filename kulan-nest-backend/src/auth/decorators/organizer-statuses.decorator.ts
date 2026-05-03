import { SetMetadata } from '@nestjs/common';

export const OrganizerStatuses = (...statuses: string[]) =>
  SetMetadata('organizerStatuses', statuses);
