import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicamentoService } from '../../../services/medicamento.service';
import { Subscription } from 'rxjs';

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

  get emDia():    any[] { return this.todasVacinas.filter(v => v.status === 'tomada'); }
  get atrasadas(): any[] { return this.todasVacinas.filter(v => v.status === 'atrasada'); }
  get pendentes(): any[] { return this.todasVacinas.filter(v => v.status === 'pendente'); }

  get listaFormatada(): { nome: string; det: string; s: 't' | 'e' }[] {
    return this.todasVacinas.map(v => ({
      nome: v.nome,
      det:  this.detalhe(v),
      s:    v.status === 'tomada' ? 't' : 'e',
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
    alert('Gerando cartão vacinal PDF... (em breve)');
  }
}