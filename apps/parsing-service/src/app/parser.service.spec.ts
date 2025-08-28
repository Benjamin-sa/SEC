import { Test, TestingModule } from '@nestjs/testing';
import { ParserService } from '../app/parser.service';
import { FormType, Form8KDto, Form10KDto } from '@ecom-trader/shared-types';

describe('ParserService', () => {
  let service: ParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParserService],
    }).compile();

    service = module.get<ParserService>(ParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseAndSave', () => {
    it('should throw BadRequestException for unsupported form type', async () => {
      const rawData = '<test>data</test>';
      
      await expect(
        service.parseAndSave(rawData, 'INVALID_TYPE' as FormType)
      ).rejects.toThrow('Unsupported form type');
    });

    it('should parse a basic 8-K form', async () => {
      const mockXmlData = `
        <submission>
          <header>
            <cik>0000320193</cik>
            <companyname>Apple Inc.</companyname>
            <filingdate>2024-01-15</filingdate>
            <accessionNumber>0000320193-24-000001</accessionNumber>
          </header>
          <document>
            <item>
              <number>1.01</number>
              <description>Entry into Material Agreement</description>
              <date>2024-01-15</date>
            </item>
          </document>
        </submission>
      `;

      const result = await service.parseAndSave(mockXmlData, FormType.FORM_8K) as Form8KDto;

      expect(result).toBeDefined();
      expect(result.formType).toBe(FormType.FORM_8K);
      expect(result.cik).toBe('0000320193');
      expect(result.companyName).toBe('Apple Inc.');
      expect(result.reportableEvents).toHaveLength(1);
      expect(result.reportableEvents[0].itemNumber).toBe('1.01');
    });

    it('should parse a basic 10-K form', async () => {
      const mockXmlData = `
        <submission>
          <header>
            <cik>0000789019</cik>
            <companyname>Microsoft Corporation</companyname>
            <filingdate>2024-07-30</filingdate>
            <accessionNumber>0000789019-24-000001</accessionNumber>
          </header>
          <document>
            <financialstatement>
              <period>Annual</period>
              <currency>USD</currency>
              <fiscalyearend>2024-06-30</fiscalyearend>
            </financialstatement>
            <businessdescription>Technology company</businessdescription>
          </document>
        </submission>
      `;

      const result = await service.parseAndSave(mockXmlData, FormType.FORM_10K) as Form10KDto;

      expect(result).toBeDefined();
      expect(result.formType).toBe(FormType.FORM_10K);
      expect(result.cik).toBe('0000789019');
      expect(result.companyName).toBe('Microsoft Corporation');
      expect(result.financialStatement.period).toBe('Annual');
      expect(result.financialStatement.currency).toBe('USD');
    });

    it('should handle malformed XML gracefully', async () => {
      const invalidXml = '<invalid><xml></invalid>';

      await expect(
        service.parseAndSave(invalidXml, FormType.FORM_8K)
      ).rejects.toThrow('Failed to parse 8-K document');
    });
  });
});