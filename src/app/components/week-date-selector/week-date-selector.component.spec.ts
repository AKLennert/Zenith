import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeekDateSelectorComponent } from './week-date-selector.component';

describe('WeekDateSelectorComponent', () => {
  let component: WeekDateSelectorComponent;
  let fixture: ComponentFixture<WeekDateSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeekDateSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeekDateSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
