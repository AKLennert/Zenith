import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PillToggleComponent } from './pill-toggle.component';

describe('PillToggleComponent', () => {
  let component: PillToggleComponent;
  let fixture: ComponentFixture<PillToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PillToggleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PillToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
