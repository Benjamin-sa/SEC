import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { CachingModule } from '../caching/caching.module';
import { SecHttpModule } from '../sec-http/sec-http.module';

@Module({
  imports: [CachingModule, SecHttpModule],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
