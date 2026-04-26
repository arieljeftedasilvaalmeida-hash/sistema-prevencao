// vacinas.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
 
@Component({
  selector: 'app-vacinas',
  standalone: true,
  imports: [
    CommonModule,   // necessário para *ngIf e *ngFor
    RouterModule,   // necessário para routerLink e routerLinkActive
  ],
  templateUrl: './vacinas.html',
  styleUrl: './vacinas.css'
})
export class Vacinas {
 
  // controla qual aba está ativa
  abaAtiva: 'tomadas' | 'pendentes' = 'tomadas';
 
  mudarAba(aba: 'tomadas' | 'pendentes') {
    this.abaAtiva = aba;
  }
 
}