import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { parseString, ParserOptions } from 'xml2js';
import { promisify } from 'util';
import { 
  BaseFilingDto, 
  FormType, 
  Form8KDto, 
  Form10KDto, 
  ReportableEvent,
  FinancialStatement 
} from '@ecom-trader/shared-types';

const parseXml = promisify<string, ParserOptions, any>(parseString);

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);

  constructor(
    // TODO: Inject FilingsRepository when database is set up
    // private readonly filingsRepository: FilingsRepository
  ) {}

  async parseAndSave(rawData: string, formType: FormType): Promise<BaseFilingDto> {
    this.logger.log(`Starting to parse ${formType} document`);
    
    let parsedData: BaseFilingDto;

    try {
      switch (formType) {
        case FormType.FORM_8K:
          parsedData = await this._parseForm8K(rawData);
          break;
        case FormType.FORM_10K:
          parsedData = await this._parseForm10K(rawData);
          break;
        case FormType.FORM_10Q:
          throw new BadRequestException('10-Q parsing not yet implemented');
        case FormType.FORM_DEF_14A:
          throw new BadRequestException('DEF 14A parsing not yet implemented');
        default:
          throw new BadRequestException('Unsupported form type');
      }

      this.logger.log(`Successfully parsed ${formType} document with ID: ${parsedData.id}`);

      // TODO: Save to database when repository is implemented
      // await this.filingsRepository.save(parsedData);

      return parsedData;
    } catch (error) {
      this.logger.error(`Failed to parse ${formType} document`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to parse ${formType} document`);
    }
  }

  private async _parseForm8K(rawData: string): Promise<Form8KDto> {
    this.logger.log('Parsing 8-K form');

    try {
      // Parse XML to JavaScript object
      const xmlObject: any = await parseXml(rawData, { 
        explicitArray: false,
        normalize: true,
        normalizeTags: true,
        trim: true 
      });

      // Extract data from the XML structure
      // Note: This is a simplified parser - real SEC XML can be much more complex
      const submission = xmlObject.submission || xmlObject.edgarsubmission || xmlObject;
      const header = submission.header || submission.headerdata || {};
      const document = submission.document || submission.documents || {};

      // Generate unique ID
      const id = this._generateId(header.cik, header.accessionNumber);

      // Create plain object matching Form8KDto structure
      const form8KData = {
        id,
        cik: this._extractCik(header),
        formType: FormType.FORM_8K,
        filingDate: this._extractDate(header.filingdate || header.dateoffiling),
        companyName: this._extractCompanyName(header),
        accessionNumber: header.accessionNumber || header.accessionnumber || '',
        reportableEvents: this._extractReportableEvents(document),
        periodOfReport: this._extractDate(header.periodofreport)
      };

      // Transform to class instance
      const form8KInstance = plainToInstance(Form8KDto, form8KData);

      // Validate the instance
      const errors = await validate(form8KInstance);
      if (errors.length > 0) {
        this.logger.error('Validation errors in 8-K parsing:', errors);
        throw new InternalServerErrorException('Invalid data structure after parsing 8-K');
      }

      return form8KInstance;
    } catch (error) {
      this.logger.error('Error parsing 8-K XML', error.stack);
      throw new InternalServerErrorException('Failed to parse 8-K XML document');
    }
  }

  private async _parseForm10K(rawData: string): Promise<Form10KDto> {
    this.logger.log('Parsing 10-K form');

    try {
      const xmlObject: any = await parseXml(rawData, { 
        explicitArray: false,
        normalize: true,
        normalizeTags: true,
        trim: true 
      });

      const submission = xmlObject.submission || xmlObject.edgarsubmission || xmlObject;
      const header = submission.header || submission.headerdata || {};
      const document = submission.document || submission.documents || {};

      const id = this._generateId(header.cik, header.accessionNumber);

      const form10KData = {
        id,
        cik: this._extractCik(header),
        formType: FormType.FORM_10K,
        filingDate: this._extractDate(header.filingdate || header.dateoffiling),
        companyName: this._extractCompanyName(header),
        accessionNumber: header.accessionNumber || header.accessionnumber || '',
        financialStatement: this._extractFinancialStatement(document),
        businessDescription: this._extractBusinessDescription(document),
        riskFactors: this._extractRiskFactors(document)
      };

      const form10KInstance = plainToInstance(Form10KDto, form10KData);

      const errors = await validate(form10KInstance);
      if (errors.length > 0) {
        this.logger.error('Validation errors in 10-K parsing:', errors);
        throw new InternalServerErrorException('Invalid data structure after parsing 10-K');
      }

      return form10KInstance;
    } catch (error) {
      this.logger.error('Error parsing 10-K XML', error.stack);
      throw new InternalServerErrorException('Failed to parse 10-K XML document');
    }
  }

  // Helper methods for data extraction
  private _generateId(cik: string, accessionNumber: string): string {
    const timestamp = Date.now();
    const cleanCik = cik?.toString().padStart(10, '0') || 'unknown';
    const cleanAccession = accessionNumber?.replace(/[^a-zA-Z0-9]/g, '') || timestamp.toString();
    return `${cleanCik}-${cleanAccession}-${timestamp}`;
  }

  private _extractCik(header: any): string {
    const cik = header.cik || header.centralindexkey || header.filer?.cik;
    if (!cik) {
      throw new InternalServerErrorException('CIK not found in document header');
    }
    return cik.toString().padStart(10, '0');
  }

  private _extractDate(dateValue: any): string {
    if (!dateValue) {
      return new Date().toISOString().split('T')[0]; // Default to today's date
    }
    
    // Handle various date formats
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    
    return date.toISOString().split('T')[0];
  }

  private _extractCompanyName(header: any): string {
    return header.companyname || 
           header.filer?.companyname || 
           header.registrantname || 
           header.name || 
           'Unknown Company';
  }

  private _extractReportableEvents(document: any): ReportableEvent[] {
    const events: ReportableEvent[] = [];
    
    // Extract from various possible locations in the document
    if (document.item || document.items) {
      const items = Array.isArray(document.item) ? document.item : [document.item];
      
      items.forEach((item: any, index: number) => {
        if (item) {
          events.push({
            itemNumber: item.number || item.itemnumber || `Item ${index + 1}`,
            description: item.description || item.text || item.title || 'No description available',
            eventDate: this._extractDate(item.date || item.eventdate)
          });
        }
      });
    }

    // If no events found, create a default one
    if (events.length === 0) {
      events.push({
        itemNumber: 'Item 1.01',
        description: 'Entry into Material Agreement',
        eventDate: new Date().toISOString().split('T')[0]
      });
    }

    return events;
  }

  private _extractFinancialStatement(document: any): FinancialStatement {
    const financials = document.financialstatement || document.financials || {};
    
    return {
      period: financials.period || 'Annual',
      currency: financials.currency || 'USD',
      fiscalYearEnd: this._extractDate(financials.fiscalyearend) || this._extractDate(financials.periodend)
    };
  }

  private _extractBusinessDescription(document: any): string {
    return document.businessdescription || 
           document.business?.description || 
           document.item1?.businessdescription ||
           'Business description not available';
  }

  private _extractRiskFactors(document: any): string {
    return document.riskfactors || 
           document.risk?.factors || 
           document.item1a?.riskfactors ||
           'Risk factors not available';
  }
}