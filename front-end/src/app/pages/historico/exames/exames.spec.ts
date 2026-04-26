import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Exames } from './exames';

describe('Exames', () => {
  let component: Exames;
  let fixture: ComponentFixture<Exames>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Exames],
    }).compileComponents();

    fixture = TestBed.createComponent(Exames);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
