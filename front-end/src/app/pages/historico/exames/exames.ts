// historico/exames/exames.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-historico-exames',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exames.html',
  styleUrl: './exames.css',
})
export class HistoricoExames {

  exames = [
    { icon: '📄', nome: 'Hemograma completo', det: '15/03/2024 · PDF · 1,2 MB' },
    { icon: '📄', nome: 'Glicemia em jejum',  det: '02/01/2024 · PDF · 0,8 MB' },
    { icon: '🖼',  nome: 'Raio-X tórax',       det: '10/11/2023 · Imagem · 3,4 MB' },
  ];

  uploadExame() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.capture = 'environment';
    input.click();
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) console.log('Exame adicionado:', file.name);
    };
  }

  verExame(ex: any) {
    console.log('Visualizar:', ex.nome);
  }

  compartilhar(ex: any) {
    if (navigator.share) {
      navigator.share({ title: ex.nome, text: 'Segue meu exame para análise.' });
    } else {
      console.log('Compartilhar:', ex.nome);
    }
  }

  gerarPDF() {
    alert('Exportando exames em PDF... (integrar com jsPDF)');
  }
}