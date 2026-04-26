// historico/risco/risco.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-historico-risco',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './risco.html',
  styleUrl: './risco.css',
})
export class HistoricoRisco {

  fatores = [
    { emoji: '❌', nome: 'Doses esquecidas',   desc: '3 esquecimentos esta semana',   pos: false, nivel: 'alto'  },
    { emoji: '❌', nome: 'Vacina atrasada',     desc: 'Tétano com reforço vencido',    pos: false, nivel: 'medio' },
    { emoji: '❌', nome: 'Doses adiadas',       desc: 'Roacutan adiado 2x na semana',  pos: false, nivel: 'medio' },
    { emoji: '✅', nome: 'Boa adesão geral',    desc: '86% de conformidade no mês',    pos: true,  nivel: 'baixo' },
    { emoji: '✅', nome: 'Remédios ativos',     desc: 'Todos os toggles habilitados',  pos: true,  nivel: 'baixo' },
  ];

  recomendacoes = [
    'Atualize o reforço da vacina de Tétano com seu médico.',
    'Evite adiar o Roacutan — tome sempre no horário programado.',
    'Ative as notificações do app para não esquecer as doses.',
    'Compartilhe este relatório com seu médico na próxima consulta.',
  ];

  gerarPDF() {
    alert('Gerando relatório de risco PDF... (integrar com jsPDF)');
  }
}
