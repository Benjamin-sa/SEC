import { Injectable, Inject } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { CachingService } from '../caching/caching.service';

@Injectable()
export class GatewayService {
  constructor(
    @Inject('AXIOS_INSTANCE') private readonly httpClient: AxiosInstance,
    private readonly cachingService: CachingService
  ) {}

  async getRssFeed(): Promise<any> {
    const cacheKey = 'rss-feed';
    
    // Try to get from cache first
    const cachedData = await this.cachingService.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // Fetch from SEC API
    const response = await this.httpClient.get('/xbrl-rss/edgar-xbrl-rss.xml');
    const data = response.data;

    // Store in cache with 15-minute TTL (900 seconds)
    await this.cachingService.set(cacheKey, JSON.stringify(data), 900);
    
    return data;
  }

  async getSubmissions(cik: string): Promise<any> {
    const paddedCik = cik.padStart(10, '0');
    const cacheKey = `submissions:${cik}`;
    
    // Try to get from cache first
    const cachedData = await this.cachingService.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // Fetch from SEC API
    const response = await this.httpClient.get(`/submissions/CIK${paddedCik}.json`);
    const data = response.data;

    // Store in cache with 24-hour TTL (86400 seconds)
    await this.cachingService.set(cacheKey, JSON.stringify(data), 86400);
    
    return data;
  }
}
