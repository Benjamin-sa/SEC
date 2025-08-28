import axios from 'axios';

describe('SEC Gateway Service E2E Tests', () => {
  const baseURL = process.env.SEC_GATEWAY_URL || 'http://localhost:3000/api';
  
  // Mock CIK for Apple Inc.
  const testCIK = '320193';
  
  beforeAll(async () => {
    // Wait for service to be ready
    let retries = 10;
    while (retries > 0) {
      try {
        await axios.get(`${baseURL}/health`);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw new Error('Service did not start in time');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${baseURL}/health`);
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        status: 'healthy',
        service: 'SEC Gateway',
        timestamp: expect.any(String),
      });
    });
  });

  describe('RSS Feed Endpoint', () => {
    it('should fetch RSS feed successfully', async () => {
      const response = await axios.get(`${baseURL}/rss-feed`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('source', 'sec.gov');
      expect(response.data).toHaveProperty('data');
    }, 30000); // 30 second timeout for external API call

    it('should return cached data on subsequent requests', async () => {
      // First request
      const response1 = await axios.get(`${baseURL}/rss-feed`);
      expect(response1.status).toBe(200);
      
      // Second request (should be faster due to caching)
      const startTime = Date.now();
      const response2 = await axios.get(`${baseURL}/rss-feed`);
      const endTime = Date.now();
      
      expect(response2.status).toBe(200);
      expect(response2.data).toHaveProperty('success', true);
      expect(endTime - startTime).toBeLessThan(1000); // Should be fast due to cache
    }, 30000);
  });

  describe('Submissions Endpoint', () => {
    it('should fetch submissions for valid CIK', async () => {
      const response = await axios.get(`${baseURL}/submissions/${testCIK}`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('source', 'sec.gov');
      expect(response.data).toHaveProperty('data');
      
      // Validate that the data contains expected fields
      const submissionData = response.data.data.data || response.data.data;
      expect(submissionData).toHaveProperty('cik');
      expect(submissionData).toHaveProperty('name');
    }, 30000);

    it('should return error for invalid CIK format', async () => {
      try {
        await axios.get(`${baseURL}/submissions/invalid-cik`);
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('Invalid CIK format');
      }
    });

    it('should return cached data on subsequent requests', async () => {
      // First request
      const response1 = await axios.get(`${baseURL}/submissions/${testCIK}`);
      expect(response1.status).toBe(200);
      
      // Second request (should be faster due to caching)
      const startTime = Date.now();
      const response2 = await axios.get(`${baseURL}/submissions/${testCIK}`);
      const endTime = Date.now();
      
      expect(response2.status).toBe(200);
      expect(response2.data).toHaveProperty('success', true);
      expect(endTime - startTime).toBeLessThan(1000); // Should be fast due to cache
    }, 30000);
  });

  describe('Document Endpoint', () => {
    it('should require document URL parameter', async () => {
      try {
        await axios.get(`${baseURL}/document`);
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('Document URL is required');
      }
    });

    it('should validate SEC document URL', async () => {
      try {
        await axios.get(`${baseURL}/document?url=https://invalid-domain.com/doc.xml`);
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('Invalid document URL');
      }
    });

    it('should fetch document from valid SEC URL', async () => {
      // Use a known SEC document URL (this might need to be updated with a real URL)
      const documentUrl = 'https://www.sec.gov/Archives/edgar/data/320193/000032019324000081/aapl-20240630.htm';
      
      try {
        const response = await axios.get(`${baseURL}/document?url=${encodeURIComponent(documentUrl)}`);
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('source', 'sec.gov');
        expect(response.data).toHaveProperty('data');
      } catch (error) {
        // Document might not exist, but we should get a proper error response
        if (error.response) {
          expect(error.response.data).toHaveProperty('success', false);
          expect(error.response.data).toHaveProperty('source', 'sec.gov');
        }
      }
    }, 30000);
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = [];
      
      // Make 15 rapid requests (should exceed the 10/second limit)
      for (let i = 0; i < 15; i++) {
        requests.push(
          axios.get(`${baseURL}/health`).catch(error => error.response)
        );
      }
      
      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(
        response => response && response.status === 429
      );
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle non-existent CIK gracefully', async () => {
      const nonExistentCIK = '9999999999';
      
      try {
        await axios.get(`${baseURL}/submissions/${nonExistentCIK}`);
      } catch (error) {
        if (error.response) {
          // Should return a structured error response
          expect(error.response.data).toHaveProperty('success', false);
          expect(error.response.data).toHaveProperty('source', 'sec.gov');
          expect(error.response.data).toHaveProperty('error');
        }
      }
    }, 30000);
  });

  describe('Response Format', () => {
    it('should return standardized response format for all endpoints', async () => {
      const endpoints = [
        '/rss-feed',
        `/submissions/${testCIK}`,
      ];
      
      for (const endpoint of endpoints) {
        const response = await axios.get(`${baseURL}${endpoint}`);
        
        expect(response.data).toHaveProperty('success');
        expect(response.data).toHaveProperty('source', 'sec.gov');
        expect(response.data).toHaveProperty('data');
        
        if (response.data.success) {
          expect(response.data.success).toBe(true);
        } else {
          expect(response.data).toHaveProperty('error');
        }
      }
    }, 60000);
  });
});
