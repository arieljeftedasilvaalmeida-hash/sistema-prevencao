import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MedicamentoService, RegistroRemedio } from '../../../services/medicamento.service';
import { Subscription } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

interface Fator {
  emoji: string;
  nome:  string;
  desc:  string;
  pos:   boolean;
  nivel: 'baixo' | 'medio' | 'alto';
}

@Component({
  selector: 'app-historico-risco',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
  templateUrl: './risco.html',
  styleUrl: './risco.css',
})
export class HistoricoRisco implements OnInit, OnDestroy {

  private service = inject(MedicamentoService);
  private cdr     = inject(ChangeDetectorRef);
  private subs: Subscription[] = [];

  registros:  RegistroRemedio[] = [];
  vacinas:    any[] = [];

  fatores:       Fator[] = [];
  recomendacoes: string[] = [];
  nivelRisco:    'Baixo' | 'Médio' | 'Alto' = 'Baixo';
  nivelClasse:   'baixo' | 'medio' | 'alto' = 'baixo';

  ngOnInit() {
    const s1 = this.service.listarHistoricoRemedios(30).subscribe({
      next: dados => {
        this.registros = [...dados];
        this.calcular();
        this.cdr.detectChanges();
      },
      error: err => console.error('ERRO risco remedios:', err)
    });

    const s2 = this.service.listarVacinas().subscribe({
      next: dados => {
        this.vacinas = [...dados];
        this.calcular();
        this.cdr.detectChanges();
      },
      error: err => console.error('ERRO risco vacinas:', err)
    });

    this.subs.push(s1, s2);
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }

  private calcular() {
    const fatores: Fator[] = [];
    const recs:    string[] = [];

    // ── Adesão ──────────────────────────────────────────
    const tomados = this.registros.filter(r => r.acao === 'tomado').length;
    const total   = this.registros.filter(r => r.acao !== 'adiado').length;
    const pct     = total === 0 ? 100 : Math.round((tomados / total) * 100);

    if (pct >= 80) {
      fatores.push({ emoji: '✅', nome: 'Boa adesão geral', desc: `${pct}% de conformidade no mês`, pos: true, nivel: 'baixo' });
    } else if (pct >= 50) {
      fatores.push({ emoji: '⚠️', nome: 'Adesão regular', desc: `${pct}% de conformidade no mês`, pos: false, nivel: 'medio' });
      recs.push('Tente tomar os medicamentos sempre no mesmo horário para criar o hábito.');
    } else {
      fatores.push({ emoji: '❌', nome: 'Baixa adesão', desc: `${pct}% de conformidade no mês`, pos: false, nivel: 'alto' });
      recs.push('Sua adesão está baixa. Ative as notificações do app para não esquecer as doses.');
    }

    // ── Esquecimentos na semana ──────────────────────────
    const inicio7 = new Date();
    inicio7.setDate(inicio7.getDate() - 6);
    inicio7.setHours(0, 0, 0, 0);
    const semana = this.registros.filter(r => this.toDate(r.dataHora).getTime() >= inicio7.getTime());
    const esq7   = semana.filter(r => r.acao === 'esquecido').length;

    if (esq7 >= 3) {
      fatores.push({ emoji: '❌', nome: 'Doses esquecidas', desc: `${esq7} esquecimentos esta semana`, pos: false, nivel: 'alto' });
      recs.push('Compartilhe este relatório com seu médico na próxima consulta.');
    } else if (esq7 > 0) {
      fatores.push({ emoji: '⚠️', nome: 'Doses esquecidas', desc: `${esq7} esquecimento(s) esta semana`, pos: false, nivel: 'medio' });
    }

    // ── Doses adiadas ────────────────────────────────────
    const adiados = semana.filter(r => r.acao === 'adiado').length;
    if (adiados >= 2) {
      fatores.push({ emoji: '❌', nome: 'Doses adiadas', desc: `${adiados} adiamentos esta semana`, pos: false, nivel: 'medio' });
      recs.push('Evite adiar os medicamentos — tome sempre no horário programado.');
    }

    // ── Vacinas atrasadas ────────────────────────────────
    const vacsAtrasadas = this.vacinas.filter(v => v.status === 'atrasada');
    if (vacsAtrasadas.length > 0) {
      const nomes = vacsAtrasadas.map((v: any) => v.nome).join(', ');
      fatores.push({ emoji: '❌', nome: 'Vacina atrasada', desc: nomes, pos: false, nivel: 'medio' });
      recs.push(`Atualize as vacinas atrasadas (${nomes}) com seu médico.`);
    } else if (this.vacinas.length > 0) {
      fatores.push({ emoji: '✅', nome: 'Vacinas em dia', desc: 'Nenhuma vacina atrasada', pos: true, nivel: 'baixo' });
    }

    // ── Remédios ativos ──────────────────────────────────
    if (this.registros.length > 0) {
      fatores.push({ emoji: '✅', nome: 'Remédios ativos', desc: 'Há registros de uso recente', pos: true, nivel: 'baixo' });
    }

    // ── Nível geral ──────────────────────────────────────
    const temAlto  = fatores.some(f => !f.pos && f.nivel === 'alto');
    const temMedio = fatores.some(f => !f.pos && f.nivel === 'medio');

    if (temAlto)       { this.nivelRisco = 'Alto';  this.nivelClasse = 'alto';  }
    else if (temMedio) { this.nivelRisco = 'Médio'; this.nivelClasse = 'medio'; }
    else               { this.nivelRisco = 'Baixo'; this.nivelClasse = 'baixo'; }

    if (recs.length === 0) recs.push('Continue assim! Mantenha a regularidade dos seus medicamentos.');

    this.fatores       = fatores;
    this.recomendacoes = recs;
  }

  private toDate(ts: Timestamp | any): Date {
    if (ts?.seconds) return new Date(ts.seconds * 1000);
    if (ts?.toDate)  return ts.toDate();
    return new Date(ts);
  }

  gerarPDF() {
    alert('Gerando relatório de risco PDF... (em breve)');
  }
}