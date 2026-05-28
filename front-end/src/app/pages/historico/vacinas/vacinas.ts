import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicamentoService } from '../../../services/medicamento.service';
import { Subscription } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-historico-vacinas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vacinas.html',
  styleUrl: './vacinas.css',
})
export class HistoricoVacinas implements OnInit, OnDestroy {

  private service = inject(MedicamentoService);
  private cdr     = inject(ChangeDetectorRef);
  private sub!: Subscription;

  todasVacinas: any[] = [];

  /**
   * Status calculado dinamicamente — não depende do valor salvo no Firebase.
   * - 'tomada'   → salvo como tomada
   * - 'atrasada' → tem proxima E essa data já passou hoje
   * - 'pendente' → todo o resto
   */
  statusReal(v: any): 'tomada' | 'pendente' | 'atrasada' {
    if (v.status === 'tomada') return 'tomada';

    // Se tem data de próxima dose, calcula automaticamente
    if (v.proxima) {
      const proxima = new Date(v.proxima + 'T00:00:00');
      const hoje    = new Date();
      hoje.setHours(0, 0, 0, 0);
      return proxima < hoje ? 'atrasada' : 'pendente';
    }

    // Sem data proxima: respeita o status salvo no Firebase
    // (ex: Influenza salva como 'atrasada' sem próxima dose definida)
    if (v.status === 'atrasada') return 'atrasada';

    return 'pendente';
  }

  get emDia():    any[] { return this.todasVacinas.filter(v => this.statusReal(v) === 'tomada');   }
  get atrasadas(): any[] { return this.todasVacinas.filter(v => this.statusReal(v) === 'atrasada'); }
  get pendentes(): any[] { return this.todasVacinas.filter(v => this.statusReal(v) === 'pendente'); }

  get listaFormatada(): { nome: string; det: string; s: 't' | 'a' }[] {
    // Só exibe vacinas Em dia ou Atrasadas — pendentes não aparecem na lista
    return this.todasVacinas
      .filter(v => this.statusReal(v) !== 'pendente')
      .map(v => ({
        nome: v.nome,
        det:  this.detalhe(v),
        s:    this.statusReal(v) === 'tomada' ? 't' : 'a',
      }));
  }

  private detalhe(v: any): string {
    const partes: string[] = [];
    if (v.data)    partes.push(this.formatarData(v.data));
    if (v.dose)    partes.push(v.dose);
    if (v.proxima) partes.push(`Próxima: ${this.formatarData(v.proxima)}`);
    return partes.join(' · ') || '—';
  }

  private formatarData(d: string): string {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return d;
  }

  ngOnInit() {
    this.sub = this.service.listarVacinas().subscribe({
      next: dados => {
        this.todasVacinas = [...dados];
        this.cdr.detectChanges();
      },
      error: err => console.error('ERRO vacinas:', err)
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  gerarPDF() {
    const pdf = new jsPDF();
    pdf.setFontSize(20);
    pdf.text('Cartão Vacinal', 14, 20);
    pdf.setFontSize(12);
    pdf.text(`Vacinas em dia: ${this.emDia.length}`, 14, 35);
    pdf.text(`Vacinas atrasadas: ${this.atrasadas.length}`, 14, 43);
    pdf.text(`Vacinas pendentes: ${this.pendentes.length}`, 14, 51);

    const dados = this.todasVacinas
      .filter(v => this.statusReal(v) !== 'pendente')
      .map(v => {
      const s = this.statusReal(v);
      return [
        v.nome || '-',
        s === 'tomada' ? 'Em dia' : s === 'atrasada' ? 'Atrasada' : 'Pendente',
        v.dose    || '-',
        v.data    ? this.formatarData(v.data)    : '-',
        v.proxima ? this.formatarData(v.proxima) : '-',
      ];
    });

    autoTable(pdf, {
      startY: 65,
      head: [['Vacina', 'Status', 'Dose', 'Aplicação', 'Próxima dose']],
      body: dados,
    });

    const paginas = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= paginas; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.text('Carteira vacinal gerada pelo sistema', 14, pdf.internal.pageSize.height - 10);
    }

    pdf.save('cartao-vacinal.pdf');
  }
}