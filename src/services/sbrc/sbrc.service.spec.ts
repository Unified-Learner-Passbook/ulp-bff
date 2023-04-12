import { Test, TestingModule } from '@nestjs/testing';
import { SbrcService } from './sbrc.service';

describe('SbrcService', () => {
  let service: SbrcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SbrcService],
    }).compile();

    service = module.get<SbrcService>(SbrcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
