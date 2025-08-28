import { IsString, IsNotEmpty, IsDateString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum FormType {
  FORM_8K = '8-K',
  FORM_10K = '10-K',
  FORM_10Q = '10-Q',
  FORM_DEF_14A = 'DEF 14A',
}

export class BaseFilingDto {
  @IsString()
  @IsNotEmpty()
  id: string; // A unique ID that we generate

  @IsString()
  @IsNotEmpty()
  cik: string;

  @IsEnum(FormType)
  formType: FormType;

  @IsDateString()
  filingDate: string;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  accessionNumber: string;
}

export class ReportableEvent {
  @IsString()
  @IsNotEmpty()
  itemNumber: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  eventDate?: string;
}

export class Form8KDto extends BaseFilingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportableEvent)
  reportableEvents: ReportableEvent[];

  @IsString()
  periodOfReport?: string;
}

export class FinancialStatement {
  @IsString()
  @IsNotEmpty()
  period: string;

  @IsString()
  currency: string;

  @IsString()
  fiscalYearEnd: string;
}

export class Form10KDto extends BaseFilingDto {
  @ValidateNested()
  @Type(() => FinancialStatement)
  financialStatement: FinancialStatement;

  @IsString()
  businessDescription?: string;

  @IsString()
  riskFactors?: string;
}