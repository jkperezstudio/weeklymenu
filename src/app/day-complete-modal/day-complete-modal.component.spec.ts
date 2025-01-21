import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DayCompleteModalComponent } from './day-complete-modal.component';

describe('DayCompleteModalComponent', () => {
  let component: DayCompleteModalComponent;
  let fixture: ComponentFixture<DayCompleteModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DayCompleteModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DayCompleteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
