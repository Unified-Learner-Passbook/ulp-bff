import { Test, TestingModule } from '@nestjs/testing';
import { AadharService } from './aadhar.service';

describe('AadharService', () => {
  let service: AadharService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AadharService],
    }).compile();

    service = module.get<AadharService>(AadharService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
