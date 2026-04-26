import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Risco } from './risco';

describe('Risco', () => {
  let component: Risco;
  let fixture: ComponentFixture<Risco>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Risco],
    }).compileComponents();

    fixture = TestBed.createComponent(Risco);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
