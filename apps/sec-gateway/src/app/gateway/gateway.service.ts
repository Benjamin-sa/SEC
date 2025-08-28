import { Injectable, Inject, Logger } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { CachingService } from '../caching/caching.service';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  constructor(
    @Inject('AXIOS_INSTANCE') private readonly httpClient: AxiosInstance,
    private readonly cachingService: CachingService
  ) {}

  async getRssFeed(): Promise<any> {
    const cacheKey = 'rss-feed';
    
    // Try to get from cache first
    const cachedData = await this.cachingService.get(cacheKey);
    if (cachedData) {
      this.logger.log('RSS feed retrieved from cache');
      return {
        success: true,
        source: 'sec.gov',
        data: JSON.parse(cachedData)
      };
    }

    this.logger.log('Fetching RSS feed from SEC API');
    
    // Fetch from SEC API
    const response = await this.httpClient.get('/xbrl-rss/edgar-xbrl-rss.xml');
    const data = response.data;

    const result = {
      success: true,
      source: 'sec.gov',
      data: data
    };

    // Store in cache with 15-minute TTL (900 seconds)
    await this.cachingService.set(cacheKey, JSON.stringify(result), 900);
    
    return result;
  }

  async getSubmissions(cik: string): Promise<any> {
    const paddedCik = cik.padStart(10, '0');
    const cacheKey = `submissions:${paddedCik}`;
    
    // Try to get from cache first
    const cachedData = await this.cachingService.get(cacheKey);
    if (cachedData) {
      this.logger.log(`Submissions for CIK ${paddedCik} retrieved from cache`);
      return {
        success: true,
        source: 'sec.gov',
        data: JSON.parse(cachedData)
      };
    }

    this.logger.log(`Fetching submissions for CIK ${paddedCik} from SEC API`);

    // Fetch from SEC API
    const response = await this.httpClient.get(`/submissions/CIK${paddedCik}.json`);
    const data = response.data;

    const result = {
      success: true,
      source: 'sec.gov',
      data: data
    };

    // Store in cache with 24-hour TTL (86400 seconds)
    await this.cachingService.set(cacheKey, JSON.stringify(result), 86400);
    
    return result;
  }

  async getDocument(documentUrl: string): Promise<any> {
    // Extract the path from the full URL for caching
    const urlObj = new URL(documentUrl);
    const documentPath = urlObj.pathname;
    const cacheKey = `document:${documentPath}`;
    
    // Try to get from cache first
    const cachedData = await this.cachingService.get(cacheKey);
    if (cachedData) {
      this.logger.log(`Document ${documentPath} retrieved from cache`);
      return {
        success: true,
        source: 'sec.gov',
        data: JSON.parse(cachedData)
      };
    }

    this.logger.log(`Fetching document ${documentPath} from SEC`);

    // For SEC documents, we need to make a direct request to the full URL
    // since it might not be under the data.sec.gov domain
    const response = await this.httpClient.get(documentUrl, {
      baseURL: '', // Override baseURL for this request
    });
    
    const data = response.data;

    const result = {
      success: true,
      source: 'sec.gov',
      data: data
    };

    // Store in cache with 1-hour TTL (3600 seconds) for documents
    await this.cachingService.set(cacheKey, JSON.stringify(result), 3600);
    
    return result;
  }
}
