import { Test, TestingModule } from '@nestjs/testing';

import { IsotopePublicationController } from './isotopes.controller.js';

describe('IsotopesController', () => {
  let controller: IsotopePublicationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IsotopePublicationController],
    }).compile();

    controller = module.get<IsotopePublicationController>(IsotopePublicationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
