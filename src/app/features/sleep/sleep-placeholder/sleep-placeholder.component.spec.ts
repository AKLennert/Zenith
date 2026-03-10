import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SleepPlaceholderComponent } from './sleep-placeholder.component';

describe('SleepPlaceholderComponent', () => {
  let component: SleepPlaceholderComponent;
  let fixture: ComponentFixture<SleepPlaceholderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SleepPlaceholderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SleepPlaceholderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
