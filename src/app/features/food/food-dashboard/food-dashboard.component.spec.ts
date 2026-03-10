import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoodDashboardComponent } from './food-dashboard.component';

describe('FoodDashboardComponent', () => {
  let component: FoodDashboardComponent;
  let fixture: ComponentFixture<FoodDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoodDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FoodDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
