import { Controller, Post, Body, BadRequestException, Logger } from '@nestjs/common';
import { ParserService } from './parser.service';
import { FormType } from '@ecom-trader/shared-types';

export class ParseRequestDto {
  rawData: string;
  formType: FormType;
}

@Controller('parse')
export class ParserController {
  private readonly logger = new Logger(ParserController.name);

  constructor(private readonly parserService: ParserService) {}

  @Post()
  async parseDocument(@Body() parseRequest: ParseRequestDto) {
    this.logger.log(`Received parsing request for form type: ${parseRequest.formType}`);

    // Validate request
    if (!parseRequest.rawData) {
      throw new BadRequestException('Raw data is required');
    }

    if (!parseRequest.formType) {
      throw new BadRequestException('Form type is required');
    }

    if (!Object.values(FormType).includes(parseRequest.formType)) {
      throw new BadRequestException(`Unsupported form type: ${parseRequest.formType}`);
    }

    try {
      const result = await this.parserService.parseAndSave(
        parseRequest.rawData, 
        parseRequest.formType
      );

      this.logger.log(`Successfully parsed document with ID: ${result.id}`);

      return {
        success: true,
        data: result,
        message: `Successfully parsed ${parseRequest.formType} document`
      };
    } catch (error) {
      this.logger.error(`Failed to parse ${parseRequest.formType} document`, error.stack);
      
      return {
        success: false,
        error: error.message || 'Internal server error',
        formType: parseRequest.formType
      };
    }
  }
}