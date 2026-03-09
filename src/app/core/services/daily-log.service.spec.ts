import { TestBed } from '@angular/core/testing';

import { DailyLogService } from './daily-log.service';

describe('DailyLogService', () => {
  let service: DailyLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailyLogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
