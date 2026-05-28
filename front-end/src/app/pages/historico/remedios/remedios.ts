// historico/remedios/remedios.ts
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicamentoService, RegistroRemedio } from '../../../services/medicamento.service';
import { Subscription } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-historico-remedios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './remedios.html',
  styleUrl: './remedios.css',
})
export class HistoricoRemedios implements OnInit, OnDestroy {

  private service = inject(MedicamentoService);
  private cdr     = inject(ChangeDetectorRef);
  private sub!: Subscription;

  registros: RegistroRemedio[] = [];

  get semanaInicio(): Date {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  get registrosSemana(): RegistroRemedio[] {
    const inicio = this.semanaInicio.getTime();
    return this.registros.filter(r => this.toDate(r.dataHora).getTime() >= inicio);
  }

  get tomadosSemana():    number { return this.registrosSemana.filter(r => r.acao === 'tomado').length; }
  get esquecidosSemana(): number { return this.registrosSemana.filter(r => r.acao === 'esquecido').length; }

  get pctAdesaoMes(): number {

  const tomados = this.registros.filter(
    r => r.acao === 'tomado'
  ).length;

  const esquecidos = this.registros.filter(
    r => r.acao === 'esquecido'
  ).length;

  const total = tomados + esquecidos;

  return total === 0
    ? 0
    : Math.round((tomados / total) * 100);
}

  get badgeAdesao(): string {
    const p = this.pctAdesaoMes;
    if (p >= 80) return 'Boa adesão';
    if (p >= 50) return 'Adesão regular';
    return 'Baixa adesão';
  }

  get badgeAdesaoCor(): string {
    const p = this.pctAdesaoMes;
    if (p >= 80) return 'verde';
    if (p >= 50) return 'laranja';
    return 'vermelho';
  }

  get semana(): { l: string; n: number; s: 't' | 'e' | 'p' }[] {
    const letras = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    return Array.from({ length: 7 }, (_, i) => {
      const dia = new Date();
      dia.setDate(dia.getDate() - 6 + i);
      dia.setHours(0, 0, 0, 0);
      const fim = new Date(dia);
      fim.setHours(23, 59, 59, 999);

      const doDia = this.registros.filter(r => {
        const t = this.toDate(r.dataHora).getTime();
        return t >= dia.getTime() && t <= fim.getTime();
      });

      let s: 't' | 'e' | 'p' = 'p';
      if (doDia.some(r => r.acao === 'tomado'))         s = 't';
      else if (doDia.some(r => r.acao === 'esquecido')) s = 'e';

      return { l: letras[dia.getDay()], n: dia.getDate(), s };
    });
  }

  get listaFormatada(): { nome: string; det: string; s: 't' | 'e' }[] {
    return this.registros
      .filter(r => r.acao !== 'adiado')
      .slice(0, 20)
      .map(r => ({
        nome: `${r.icone} ${r.nome}`,
        det:  this.formatarDataHora(r.dataHora),
        s:    r.acao === 'tomado' ? 't' : 'e',
      }));
  }

  ngOnInit() {
    this.sub = this.service.listarHistoricoRemedios(30).subscribe({
      next: dados => {
        this.registros = [...dados];
        this.cdr.detectChanges();
      },
      error: err => console.error('ERRO:', err)
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  private toDate(ts: Timestamp | any): Date {
    if (ts?.seconds) return new Date(ts.seconds * 1000);
    if (ts?.toDate)  return ts.toDate();
    return new Date(ts);
  }

  private formatarDataHora(ts: Timestamp | any): string {
    const d     = this.toDate(ts);
    const hoje  = new Date();
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);

    const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (d.toDateString() === hoje.toDateString())  return `Hoje · ${hora}`;
    if (d.toDateString() === ontem.toDateString()) return `Ontem · ${hora}`;
    return `${d.toLocaleDateString('pt-BR')} · ${hora}`;
  }

  gerarPDF() {

    const pdf = new jsPDF();

    // Título
    pdf.setFontSize(20);
    pdf.text('Relatório de Medicamentos', 14, 20);

    // Informações gerais
    pdf.setFontSize(12);

    pdf.text(`Adesão do mês: ${this.pctAdesaoMes}%`, 14, 35);
    pdf.text(`Tomados esta semana: ${this.tomadosSemana}`, 14, 43);
    pdf.text(`Esquecidos esta semana: ${this.esquecidosSemana}`, 14, 51);

    // Dados da tabela
    const dados = this.registros
      .filter(r => r.acao !== 'adiado')
      .map(r => [
        r.nome,
        r.acao === 'tomado' ? 'Tomado' : 'Esquecido',
        this.formatarDataHora(r.dataHora)
      ]);

    // Tabela
    autoTable(pdf, {
      startY: 65,
      head: [['Medicamento', 'Status', 'Data/Hora']],
      body: dados,
    });

    // Nome do arquivo
    pdf.save('relatorio-medicamentos.pdf');
  }
}