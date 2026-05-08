import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Institutions } from './institutions';

describe('Institutions', () => {
  let component: Institutions;
  let fixture: ComponentFixture<Institutions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Institutions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Institutions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
