import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterStakeholder } from './register-stakeholder';

describe('RegisterStakeholder', () => {
  let component: RegisterStakeholder;
  let fixture: ComponentFixture<RegisterStakeholder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterStakeholder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterStakeholder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
