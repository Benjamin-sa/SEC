# SEC Gateway Service

The SEC Gateway Service is a NestJS-based microservice that acts as the sole interface between our system and the SEC EDGAR APIs. It implements rate limiting, caching, and error handling to ensure reliable and compliant access to SEC data.

## Features

- ✅ **Rate Limiting**: Enforces SEC's 10 requests per second limit
- ✅ **Redis Caching**: Intelligent caching with configurable TTL
- ✅ **Error Handling**: Comprehensive error translation and handling
- ✅ **User-Agent Compliance**: Automatic User-Agent header injection
- ✅ **Docker Ready**: Multi-stage Docker build for production deployment

## Architecture

### Core Modules

1. **CachingModule**: Redis-based caching with configurable TTL
2. **SecHttpModule**: Axios HTTP client with SEC-specific configuration
3. **GatewayModule**: Main business logic for SEC API interactions

### Services

- **CachingService**: Handles Redis operations (get/set with TTL)
- **GatewayService**: Core business logic for SEC data retrieval

## API Endpoints

### GET /api/rss-feed

Retrieves the SEC EDGAR RSS feed.

- **Cache TTL**: 15 minutes
- **Rate Limited**: Yes (10 req/sec)

### GET /api/submissions/:cik

Retrieves company submissions for a given CIK.

- **Parameters**: `cik` - Company Central Index Key (numeric)
- **Cache TTL**: 24 hours
- **Rate Limited**: Yes (10 req/sec)

## Configuration

The service uses environment variables for configuration:

```bash
# SEC API Configuration
SEC_API_BASE_URL=https://data.sec.gov
SEC_API_USER_AGENT=MySaaS Inc. contact@mysaas.com

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Application Configuration
PORT=3000
```

## Development Setup

### Prerequisites

- Node.js 20+
- Redis server
- Nx CLI

### Local Development

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start Redis**:

   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

3. **Set environment variables**:

   ```bash
   cp apps/sec-gateway/.env.example apps/sec-gateway/.env
   # Edit the .env file with your configuration
   ```

4. **Start the development server**:
   ```bash
   npx nx serve sec-gateway
   ```

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Start all services (app + Redis)
docker-compose up -d

# View logs
docker-compose logs -f sec-gateway

# Stop services
docker-compose down
```

### Using Docker Only

```bash
# Build the image
docker build -f apps/sec-gateway/Dockerfile -t sec-gateway .

# Run with Redis
docker run -d --name redis redis:7-alpine
docker run -d \
  --name sec-gateway \
  --link redis:redis \
  -p 3000:3000 \
  -e REDIS_HOST=redis \
  -e REDIS_PORT=6379 \
  -e SEC_API_BASE_URL=https://data.sec.gov \
  -e SEC_API_USER_AGENT="MySaaS Inc. contact@mysaas.com" \
  sec-gateway
```

## Production Considerations

### Rate Limiting

- The service enforces SEC's 10 requests per second limit globally
- Consider implementing client-side rate limiting for better user experience

### Caching Strategy

- RSS Feed: 15-minute TTL (frequent updates needed)
- Submissions: 24-hour TTL (relatively stable data)
- Monitor cache hit rates and adjust TTL as needed

### Monitoring

- Implement health checks for Redis connectivity
- Monitor rate limit violations
- Track cache hit rates
- Set up alerts for API errors

### Security

- Use HTTPS in production
- Implement proper CORS configuration
- Consider API key authentication
- Rotate User-Agent strings if needed

## Error Handling

The service translates SEC API errors to appropriate HTTP status codes:

- `404` → `NotFoundException`
- `400` → `BadRequestException`
- `403` → `ForbiddenException`
- `429` → `TooManyRequestsException`
- `500` → `InternalServerErrorException`

## Testing

```bash
# Unit tests
npx nx test sec-gateway

# E2E tests
npx nx e2e sec-gateway-e2e

# Build verification
npx nx build sec-gateway
```

## Compliance Notes

### SEC Requirements

- **User-Agent**: Must include company name and contact email
- **Rate Limiting**: Maximum 10 requests per second
- **Respect robots.txt**: Currently not implemented (consider for future)

### Best Practices

- Cache aggressively to minimize API calls
- Implement exponential backoff for retries
- Log all API interactions for audit purposes
- Monitor for rate limit violations
