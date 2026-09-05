import { Test, TestingModule } from '@nestjs/testing';

import { IsotopesController } from './isotopes.controller.js';

describe('IsotopesController', () => {
  let controller: IsotopesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IsotopesController],
    }).compile();

    controller = module.get<IsotopesController>(IsotopesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
