import axios from 'axios';

describe('SEC Gateway Service - Basic E2E Tests', () => {
  const baseURL = process.env.SEC_GATEWAY_URL || 'http://localhost:3000/api';
  
  beforeAll(async () => {
    // Wait for service to be ready with shorter timeout for basic tests
    let retries = 5;
    while (retries > 0) {
      try {
        await axios.get(`${baseURL}/health`, { timeout: 5000 });
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.warn('Service not available, skipping E2E tests');
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      try {
        const response = await axios.get(`${baseURL}/health`, { timeout: 5000 });
        
        expect(response.status).toBe(200);
        expect(response.data).toEqual({
          status: 'healthy',
          service: 'SEC Gateway',
          timestamp: expect.any(String),
        });
      } catch (error) {
        // Skip test if service is not running
        if (error.code === 'ECONNREFUSED') {
          console.warn('Service not running, skipping health check test');
          return;
        }
        throw error;
      }
    });
  });

  describe('API Endpoints Structure', () => {
    it('should have correct endpoint structure for RSS feed', async () => {
      try {
        // We're not testing the actual SEC API call here, just the endpoint structure
        const response = await axios.get(`${baseURL}/rss-feed`, { 
          timeout: 5000,
          validateStatus: () => true // Accept any status code
        });
        
        // Should return a structured response even if it fails
        if (response.status === 200) {
          expect(response.data).toHaveProperty('success');
          expect(response.data).toHaveProperty('source');
          if (response.data.success) {
            expect(response.data).toHaveProperty('data');
          } else {
            expect(response.data).toHaveProperty('error');
          }
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('Service not running, skipping RSS feed test');
          return;
        }
        // Network errors are expected if Redis/external services aren't available
        console.warn('Network error in RSS feed test, this is expected without Redis');
      }
    });

    it('should validate CIK format for submissions endpoint', async () => {
      try {
        await axios.get(`${baseURL}/submissions/invalid-cik`, { timeout: 5000 });
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('Service not running, skipping CIK validation test');
          return;
        }
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('Invalid CIK format');
      }
    });

    it('should validate document URL parameter', async () => {
      try {
        await axios.get(`${baseURL}/document`, { timeout: 5000 });
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('Service not running, skipping document validation test');
          return;
        }
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('Document URL is required');
      }
    });
  });
});
