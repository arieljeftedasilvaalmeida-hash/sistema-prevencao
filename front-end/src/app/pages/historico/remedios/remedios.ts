// historico/remedios/remedios.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
 
@Component({
  selector: 'app-historico-remedios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './remedios.html',
  styleUrl: './remedios.css',
})
export class HistoricoRemedios {
 
  semana = [
    { l: 'D', n: 20, s: 't' },
    { l: 'S', n: 21, s: 't' },
    { l: 'T', n: 22, s: 'e' },
    { l: 'Q', n: 23, s: 't' },
    { l: 'Q', n: 24, s: 't' },
    { l: 'S', n: 25, s: 'e' },
    { l: 'S', n: 26, s: 'p' },
  ];
 
  registros = [
    { nome: 'Dipirona', det: 'Hoje · 10:02',  s: 't' },
    { nome: 'Roacutan', det: 'Ontem · 18:15', s: 'e' },
    { nome: 'Xultophy', det: 'Ontem · 09:50', s: 't' },
    { nome: 'Dipirona', det: '22/04 · 10:05', s: 't' },
  ];
 
  gerarPDF() {
    alert('Gerando PDF de remédios... (integrar com jsPDF)');
  }
}