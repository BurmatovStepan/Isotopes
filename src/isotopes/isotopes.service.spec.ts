import { Test, TestingModule } from '@nestjs/testing';

import { IsotopesService } from './isotopes.service.js';

describe('IsotopesService', () => {
  let service: IsotopesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IsotopesService],
    }).compile();

    service = module.get<IsotopesService>(IsotopesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
