import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  getHealth(): { status: string; service: string; timestamp: string } {
    return {
      status: 'healthy',
      service: 'SEC Gateway',
      timestamp: new Date().toISOString(),
    };
  }
}
