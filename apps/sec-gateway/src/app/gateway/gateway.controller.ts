import { Controller, Get, Param, Query, BadRequestException, Logger } from '@nestjs/common';
import { GatewayService } from './gateway.service';

@Controller()
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(private readonly gatewayService: GatewayService) {}

  @Get('rss-feed')
  async getRssFeed() {
    this.logger.log('Fetching RSS feed from SEC');
    try {
      const result = await this.gatewayService.getRssFeed();
      return {
        success: true,
        source: 'sec.gov',
        data: result
      };
    } catch (error) {
      this.logger.error('Failed to fetch RSS feed', error.stack);
      return error.standardizedError || {
        success: false,
        error: 'Failed to fetch RSS feed',
        source: 'sec.gov'
      };
    }
  }

  @Get('submissions/:cik')
  async getSubmissions(@Param('cik') cik: string) {
    // Basic CIK validation
    if (!cik || !/^\d+$/.test(cik)) {
      throw new BadRequestException('Invalid CIK format. CIK must be numeric.');
    }
    
    this.logger.log(`Fetching submissions for CIK: ${cik}`);
    try {
      const result = await this.gatewayService.getSubmissions(cik);
      return {
        success: true,
        source: 'sec.gov',
        data: result
      };
    } catch (error) {
      this.logger.error(`Failed to fetch submissions for CIK: ${cik}`, error.stack);
      return error.standardizedError || {
        success: false,
        error: `Failed to fetch submissions for CIK: ${cik}`,
        source: 'sec.gov'
      };
    }
  }

  @Get('document')
  async getDocument(@Query('url') documentUrl: string) {
    if (!documentUrl) {
      throw new BadRequestException('Document URL is required');
    }

    // Basic URL validation for SEC documents
    if (!documentUrl.includes('sec.gov')) {
      throw new BadRequestException('Invalid document URL. Must be from sec.gov domain.');
    }

    this.logger.log(`Fetching document from URL: ${documentUrl}`);
    try {
      const result = await this.gatewayService.getDocument(documentUrl);
      return {
        success: true,
        source: 'sec.gov',
        data: result
      };
    } catch (error) {
      this.logger.error(`Failed to fetch document from URL: ${documentUrl}`, error.stack);
      return error.standardizedError || {
        success: false,
        error: `Failed to fetch document from URL: ${documentUrl}`,
        source: 'sec.gov'
      };
    }
  }
}
