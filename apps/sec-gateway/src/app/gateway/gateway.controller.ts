import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import { GatewayService } from './gateway.service';

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Get('rss-feed')
  async getRssFeed() {
    return this.gatewayService.getRssFeed();
  }

  @Get('submissions/:cik')
  async getSubmissions(@Param('cik') cik: string) {
    // Basic CIK validation
    if (!cik || !/^\d+$/.test(cik)) {
      throw new BadRequestException('Invalid CIK format. CIK must be numeric.');
    }
    
    return this.gatewayService.getSubmissions(cik);
  }
}
