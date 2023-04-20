import { Test, TestingModule } from '@nestjs/testing';
import { CredService } from './cred.service';

describe('CredService', () => {
  let service: CredService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CredService],
    }).compile();

    service = module.get<CredService>(CredService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
