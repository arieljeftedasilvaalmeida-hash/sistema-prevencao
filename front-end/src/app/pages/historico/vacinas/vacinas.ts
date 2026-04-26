// historico/vacinas/vacinas.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-historico-vacinas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vacinas.html',
  styleUrl: './vacinas.css',
})
export class HistoricoVacinas {

  vacinas = [
    { nome: 'Hepatite B',    det: '12/03/2024 · 3ª dose',      s: 't' },
    { nome: 'Febre Amarela', det: '05/07/2019 · Dose única',    s: 't' },
    { nome: 'Tétano',        det: '18/01/2014 · Reforço vencido', s: 'e' },
  ];

  gerarPDF() {
    alert('Gerando cartão vacinal PDF... (integrar com jsPDF)');
  }
}