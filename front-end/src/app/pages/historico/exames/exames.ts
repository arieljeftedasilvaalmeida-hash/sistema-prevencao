import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicamentoService, RegistroExame } from '../../../services/medicamento.service';
import { Subscription } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-historico-exames',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exames.html',
  styleUrl: './exames.css',
})
export class HistoricoExames implements OnInit, OnDestroy {

  private service = inject(MedicamentoService);
  private cdr     = inject(ChangeDetectorRef);
  private sub!: Subscription;

  exames:    RegistroExame[] = [];
  carregando = true;
  enviando   = false;

  get examesFormatados() {
    return this.exames.map(e => ({
      ...e,
      icon: e.tipo === 'pdf' ? '📄' : '🖼',
      det:  `${this.formatarData(e.dataHora)} · ${e.tipo.toUpperCase()} · ${e.tamanho}`,
    }));
  }

  ngOnInit() {
    this.sub = this.service.listarExames().subscribe({
      next: dados => {
        this.exames    = [...dados];
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('ERRO exames:', err);
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  uploadExame() {
    const input   = document.createElement('input');
    input.type    = 'file';
    input.accept  = 'image/*,application/pdf';
    input.click();
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      this.enviando = true;
      this.cdr.detectChanges();
      try {
        await this.service.uploadExame(file);
      } catch (err) {
        console.error('Erro no upload:', err);
        alert('Erro ao enviar o exame. Tente novamente.');
      } finally {
        this.enviando = false;
        this.cdr.detectChanges();
      }
    };
  }

  verExame(ex: RegistroExame) {
    if (ex.url) window.open(ex.url, '_blank');
  }

  compartilhar(ex: RegistroExame) {
    if (navigator.share) {
      navigator.share({ title: ex.nome, url: ex.url });
    } else {
      navigator.clipboard?.writeText(ex.url).then(() => alert('Link copiado!'));
    }
  }

  private formatarData(ts: Timestamp | any): string {
    if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('pt-BR');
    if (ts?.toDate)  return ts.toDate().toLocaleDateString('pt-BR');
    return new Date(ts).toLocaleDateString('pt-BR');
  }

  gerarPDF() {
    alert('Exportando exames em PDF... (em breve)');
  }
}