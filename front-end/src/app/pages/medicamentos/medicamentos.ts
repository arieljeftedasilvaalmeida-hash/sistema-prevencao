// medicamentos.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MedicamentoService } from '../../services/medicamento.service';

@Component({
  selector: 'app-medicamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './medicamentos.html',
  styleUrl: './medicamentos.css',
})
export class Medicamentos {

  // inject() em vez de constructor — obrigatório no Angular 21
  private service = inject(MedicamentoService);

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

  icones = ['💊', '💉', '🩺', '🧴', '🩹', '💧', '🌡️', '🧪'];

  diasSemana = [
    { letra: 'D', valor: 'dom' },
    { letra: 'S', valor: 'seg' },
    { letra: 'T', valor: 'ter' },
    { letra: 'Q', valor: 'qua' },
    { letra: 'Q', valor: 'qui' },
    { letra: 'S', valor: 'sex' },
    { letra: 'S', valor: 'sab' },
  ];

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

  vac = {
    nome:    '',
    status:  'tomada' as 'tomada' | 'pendente' | 'atrasada',
    data:    '',
    dose:    '',
    proxima: '',
  };

  salvar() {
    if (this.tipo === 'medicamento') {
      if (!this.med.nome || !this.med.horario) {
        alert('Preencha ao menos o nome e o horário.');
        return;
      }
      this.service.adicionarMedicamento(this.med)
        .then(() => {
          alert('Medicamento adicionado com sucesso!');
          this.fecharModal();
        })
        .catch((erro) => {
          console.error(erro);
          alert('Erro ao salvar medicamento.');
        });
    } else {
      if (!this.vac.nome) {
        alert('Preencha ao menos o nome da vacina.');
        return;
      }
      this.service.adicionarVacina(this.vac)
        .then(() => {
          alert('Vacina adicionada com sucesso!');
          this.fecharModal();
        })
        .catch((erro) => {
          console.error(erro);
          alert('Erro ao salvar vacina.');
        });
    }
  }

  resetar() {
    this.med = { nome: '', icone: '💊', dosagem: '', horario: '', dias: [], obs: '' };
    this.vac = { nome: '', status: 'tomada', data: '', dose: '', proxima: '' };
  }
}