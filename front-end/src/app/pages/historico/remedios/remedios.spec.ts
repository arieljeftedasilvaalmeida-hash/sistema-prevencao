import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Remedios } from './remedios';

describe('Remedios', () => {
  let component: Remedios;
  let fixture: ComponentFixture<Remedios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Remedios],
    }).compileComponents();

    fixture = TestBed.createComponent(Remedios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
