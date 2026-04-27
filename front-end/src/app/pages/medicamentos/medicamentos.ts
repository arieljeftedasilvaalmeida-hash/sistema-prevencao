import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-medicamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './medicamentos.html',
  styleUrl: './medicamentos.css',
})
export class Medicamentos {

  // ── Modal ──
  modalAberto = false;
  tipo: 'medicamento' | 'vacina' = 'medicamento';

  abrirModal(t: 'medicamento' | 'vacina') {
    this.tipo = t;
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
    this.resetar();
  }

  // ── Ícones disponíveis ──
  icones = ['💊', '💉', '🩺', '🧴', '🩹', '💧', '🌡️', '🧪'];

  // ── Dias da semana ──
  diasSemana = [
    { letra: 'D', valor: 'dom' },
    { letra: 'S', valor: 'seg' },
    { letra: 'T', valor: 'ter' },
    { letra: 'Q', valor: 'qua' },
    { letra: 'Q', valor: 'qui' },
    { letra: 'S', valor: 'sex' },
    { letra: 'S', valor: 'sab' },
  ];

  // ── Formulário medicamento ──
  med = {
    nome:    '',
    icone:   '💊',
    dosagem: '',
    horario: '',
    dias:    [] as string[],
    obs:     '',
  };

  toggleDia(valor: string) {
    const i = this.med.dias.indexOf(valor);
    if (i >= 0) {
      this.med.dias.splice(i, 1);
    } else {
      this.med.dias.push(valor);
    }
  }

  // ── Formulário vacina ──
  vac = {
    nome:    '',
    status:  'tomada' as 'tomada' | 'pendente' | 'atrasada',
    data:    '',
    dose:    '',
    proxima: '',
  };

  // ── Salvar ──
  salvar() {
    if (this.tipo === 'medicamento') {
      if (!this.med.nome || !this.med.horario) {
        alert('Preencha ao menos o nome e o horário.');
        return;
      }
      console.log('Medicamento salvo:', this.med);
      // Aqui você integrará com seu serviço/banco de dados
    } else {
      if (!this.vac.nome) {
        alert('Preencha o nome da vacina.');
        return;
      }
      console.log('Vacina salva:', this.vac);
      // Aqui você integrará com seu serviço/banco de dados
    }
    alert(`${this.tipo === 'medicamento' ? 'Medicamento' : 'Vacina'} cadastrado com sucesso! ✅`);
    this.fecharModal();
  }

  // ── Resetar formulários ──
  resetar() {
    this.med = { nome: '', icone: '💊', dosagem: '', horario: '', dias: [], obs: '' };
    this.vac = { nome: '', status: 'tomada', data: '', dose: '', proxima: '' };
  }
}
