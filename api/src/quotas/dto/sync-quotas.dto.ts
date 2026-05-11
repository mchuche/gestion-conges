import { IsObject } from 'class-validator';

/** PUT /quotas — corps { byYear: { "2026": { "congé-payé": 25 } } } */
export class SyncQuotasDto {
  @IsObject()
  byYear: Record<string, Record<string, number>>;
}
