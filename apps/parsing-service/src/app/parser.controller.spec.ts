import { Test, TestingModule } from '@nestjs/testing';
import { ParserController } from '../app/parser.controller';
import { ParserService } from '../app/parser.service';
import { FormType, Form8KDto } from '@ecom-trader/shared-types';

describe('ParserController', () => {
  let controller: ParserController;
  let service: ParserService;

  const mockParserService = {
    parseAndSave: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParserController],
      providers: [
        {
          provide: ParserService,
          useValue: mockParserService,
        },
      ],
    }).compile();

    controller = module.get<ParserController>(ParserController);
    service = module.get<ParserService>(ParserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('parseDocument', () => {
    it('should successfully parse a document', async () => {
      const mockResult: Form8KDto = {
        id: 'test-id',
        cik: '0000320193',
        formType: FormType.FORM_8K,
        filingDate: '2024-01-15',
        companyName: 'Apple Inc.',
        accessionNumber: 'test-accession',
        reportableEvents: []
      };

      mockParserService.parseAndSave.mockResolvedValue(mockResult);

      const parseRequest = {
        rawData: '<test>data</test>',
        formType: FormType.FORM_8K
      };

      const result = await controller.parseDocument(parseRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(service.parseAndSave).toHaveBeenCalledWith(
        parseRequest.rawData,
        parseRequest.formType
      );
    });

    it('should return error for missing raw data', async () => {
      const parseRequest = {
        rawData: '',
        formType: FormType.FORM_8K
      };

      await expect(controller.parseDocument(parseRequest))
        .rejects.toThrow('Raw data is required');
    });

    it('should return error for missing form type', async () => {
      const parseRequest = {
        rawData: '<test>data</test>',
        formType: undefined as unknown as FormType
      };

      await expect(controller.parseDocument(parseRequest))
        .rejects.toThrow('Form type is required');
    });

    it('should return error for invalid form type', async () => {
      const parseRequest = {
        rawData: '<test>data</test>',
        formType: 'INVALID' as FormType
      };

      await expect(controller.parseDocument(parseRequest))
        .rejects.toThrow('Unsupported form type: INVALID');
    });

    it('should handle service errors gracefully', async () => {
      mockParserService.parseAndSave.mockRejectedValue(new Error('Service error'));

      const parseRequest = {
        rawData: '<test>data</test>',
        formType: FormType.FORM_8K
      };

      const result = await controller.parseDocument(parseRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Service error');
    });
  });
});