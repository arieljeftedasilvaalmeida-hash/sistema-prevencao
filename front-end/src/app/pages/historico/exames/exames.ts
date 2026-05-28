import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicamentoService, RegistroExame } from '../../../services/medicamento.service';
import { Subscription } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-historico-exames',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exames.html',
  styleUrls: ['./exames.css'],
})
export class HistoricoExames implements OnInit, OnDestroy {

  private service = inject(MedicamentoService);
  private cdr     = inject(ChangeDetectorRef);
  private sub!: Subscription;

  exames: RegistroExame[] = [];

  carregando = true;
  enviando   = false;

  get examesFormatados() {

    return this.exames.map(e => ({

      ...e,

      icon: e.tipo === 'pdf'
        ? '📄'
        : '🖼',

      det: `${this.formatarData(e.dataHora)} · ${e.tipo.toUpperCase()} · ${e.tamanho}`,
    }));
  }

  ngOnInit() {

    this.sub = this.service.listarExames().subscribe({

      next: dados => {

        this.exames = [...dados];

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

  ngOnDestroy() {

    this.sub?.unsubscribe();
  }

  uploadExame() {

    const input = document.createElement('input');

    input.type = 'file';

    input.accept = 'image/*,application/pdf';

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

    if (!ex.url) return;

    const isImagem =
      ex.tipo?.includes('image') ||
      ex.url.match(/\.(jpg|jpeg|png|webp)$/i);

    if (isImagem) {

      const w = window.open('', '_blank');

      if (w) {

        w.document.write(`
          <html>
            <head>
              <title>${ex.nome}</title>

              <style>

                body{
                  margin:0;
                  background:#111;
                  display:flex;
                  justify-content:center;
                  align-items:center;
                  height:100vh;
                }

                img{
                  max-width:95%;
                  max-height:95%;
                  border-radius:12px;
                  box-shadow:0 0 20px rgba(0,0,0,.5);
                }

              </style>

            </head>

            <body>

              <img src="${ex.url}" />

            </body>
          </html>
        `);
      }

    } else {

      window.open(ex.url, '_blank');
    }
  }

  compartilhar(ex: RegistroExame) {

    if (!ex.url) return;

    if (navigator.share) {

      navigator.share({

        title: ex.nome,

        url: ex.url
      });

    } else {

      navigator.clipboard
        ?.writeText(ex.url)
        .then(() => alert('Link copiado!'));
    }
  }

  private formatarData(ts: Timestamp | any): string {

    if (ts?.seconds) {

      return new Date(ts.seconds * 1000)
        .toLocaleDateString('pt-BR');
    }

    if (ts?.toDate) {

      return ts.toDate()
        .toLocaleDateString('pt-BR');
    }

    return new Date(ts)
      .toLocaleDateString('pt-BR');
  }

  gerarPDF() {

    const pdf = new jsPDF();

    // ─────────────────────────────
    // Título
    // ─────────────────────────────

    pdf.setFontSize(22);

    pdf.text('Relatório de Exames', 14, 20);

    pdf.setFontSize(12);

    pdf.text(
      `Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
      14,
      30
    );

    // ─────────────────────────────
    // Resumo
    // ─────────────────────────────

    pdf.setFontSize(14);

    pdf.text(
      `Total de exames: ${this.exames.length}`,
      14,
      45
    );

    // ─────────────────────────────
    // Dados tabela
    // ─────────────────────────────

    const dados = this.exames.map(ex => [

      ex.nome || '-',

      ex.tipo?.toUpperCase() || '-',

      ex.tamanho || '-',

      this.formatarData(ex.dataHora),

      ex.url || '-'
    ]);

    // ─────────────────────────────
    // Tabela
    // ─────────────────────────────

    autoTable(pdf, {

      startY: 55,

      head: [[
        'Nome',
        'Tipo',
        'Tamanho',
        'Data',
        'Arquivo'
      ]],

      body: dados,

      styles: {

        fontSize: 9
      },

      columnStyles: {

        4: {

          cellWidth: 60
        }
      }
    });

    // ─────────────────────────────
    // Rodapé
    // ─────────────────────────────

    const paginas =
      (pdf as any).internal.getNumberOfPages();

    for (let i = 1; i <= paginas; i++) {

      pdf.setPage(i);

      pdf.setFontSize(10);

      pdf.text(
        'Relatório digital de exames médicos',
        14,
        pdf.internal.pageSize.height - 10
      );
    }

    // ─────────────────────────────
    // Download
    // ─────────────────────────────

    pdf.save('exames-medicos.pdf');
  }
}