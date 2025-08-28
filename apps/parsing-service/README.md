# Parsing Service

The Parsing Service is a NestJS-based microservice responsible for converting unstructured SEC filing data (XML) into structured, validated data models. It serves as the canonical authority for data quality and structure in the SEC data processing pipeline.

## Features

- ✅ **XML Parsing**: Converts SEC XML filings to structured data using xml2js
- ✅ **Data Validation**: Validates all parsed data using class-validator before storage
- ✅ **Type Safety**: Uses TypeScript DTOs with strict typing for data consistency
- ✅ **Multiple Form Types**: Supports 8-K, 10-K, and extensible for other SEC forms
- ✅ **Error Handling**: Comprehensive error handling with detailed logging
- ✅ **Testing**: Full unit test coverage for parsing and validation logic

## Architecture

### Canonical Data Model

The service defines the "single source of truth" for how SEC data should be structured:

- **BaseFilingDto**: Common fields shared by all SEC filings
- **Form8KDto**: Specific fields for 8-K filings (reportable events)
- **Form10KDto**: Specific fields for 10-K filings (financial statements)
- **ReportableEvent**: Detailed structure for 8-K reportable events
- **FinancialStatement**: Structure for 10-K financial data

### Services

- **ParserService**: Core parsing and validation logic
- **ParserController**: HTTP API interface for internal communication

## API Endpoints

### POST /parse

Parses SEC filing data and returns structured, validated results.

**Request Body:**
```json
{
  "rawData": "<xml>...</xml>",
  "formType": "8-K"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "0000320193-000032019324000001-1735689600000",
    "cik": "0000320193",
    "formType": "8-K",
    "filingDate": "2024-01-15",
    "companyName": "Apple Inc.",
    "accessionNumber": "0000320193-24-000001",
    "reportableEvents": [
      {
        "itemNumber": "1.01",
        "description": "Entry into Material Agreement",
        "eventDate": "2024-01-15"
      }
    ]
  },
  "message": "Successfully parsed 8-K document"
}
```

## Supported Form Types

- **8-K**: Current Events (Material agreements, corporate changes)
- **10-K**: Annual Reports (Financial statements, business description)
- **10-Q**: Quarterly Reports (planned)
- **DEF 14A**: Proxy Statements (planned)

## Data Validation

All parsed data goes through strict validation:

1. **Structure Validation**: Ensures all required fields are present
2. **Type Validation**: Validates data types (strings, dates, numbers)
3. **Format Validation**: Validates date formats, CIK format, etc.
4. **Business Logic Validation**: Ensures data makes business sense

## Development

### Build
```bash
npx nx build parsing-service
```

### Test
```bash
npx nx test parsing-service
```

### Serve
```bash
npx nx serve parsing-service
```

## Docker Deployment

```bash
# Build image
docker build -f apps/parsing-service/Dockerfile -t parsing-service .

# Run container
docker run -p 3000:3000 parsing-service
```

## Error Handling

The service provides detailed error responses:

- **400 Bad Request**: Invalid form type or missing data
- **500 Internal Server Error**: XML parsing errors or validation failures

All errors are logged with detailed context for debugging.

## Future Enhancements

- Database integration for persisting parsed data
- Message queue integration for asynchronous processing
- Support for additional SEC form types
- Enhanced error recovery and retry logic
- Performance optimizations for large documents