import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MedicamentoService } from '../../services/medicamento.service';
import { Subscription } from 'rxjs';
import { Firestore, doc, deleteDoc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-vacinas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './vacinas.html',
  styleUrl: './vacinas.css',
})
export class Vacinas implements OnInit, OnDestroy {

  private service   = inject(MedicamentoService);
  private firestore = inject(Firestore);

  abaAtiva:  'tomadas' | 'pendentes' = 'tomadas';
  tomadas:   any[] = [];
  pendentes: any[] = [];
  expandido: string | null = null;

  // ── Modal de edição ──
  modalEdicao = false;
  idEdicao:   string | null = null;

  formEdicao = {
    nome:    '',
    status:  'tomada' as 'tomada' | 'pendente' | 'atrasada',
    data:    '',
    dose:    '',
    proxima: '',
  };

  private sub!: Subscription;

  ngOnInit() {
    this.sub = this.service.listarVacinas().subscribe((dados: any[]) => {
      this.tomadas   = dados.filter(v => v.status === 'tomada');
      this.pendentes = dados.filter(v => v.status === 'pendente' || v.status === 'atrasada');
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  mudarAba(aba: 'tomadas' | 'pendentes') {
    this.abaAtiva  = aba;
    this.expandido = null;
  }

  toggleExpandir(id: string) {
    this.expandido = this.expandido === id ? null : id;
  }

  // ── Abrir modal com dados preenchidos ──
  abrirEdicao(vac: any) {
    this.idEdicao = vac.id;
    this.formEdicao = {
      nome:    vac.nome    || '',
      status:  vac.status  || 'tomada',
      data:    vac.data    || '',
      dose:    vac.dose    || '',
      proxima: vac.proxima || '',
    };
    this.modalEdicao = true;
    this.expandido   = null;
  }

  fecharEdicao() {
    this.modalEdicao = false;
    this.idEdicao    = null;
  }

  // ── Salvar edição no Firebase ──
  salvarEdicao() {
    if (!this.formEdicao.nome) {
      alert('Preencha o nome da vacina.');
      return;
    }
    const ref = doc(this.firestore, 'vacinas', this.idEdicao!);
    updateDoc(ref, { ...this.formEdicao })
      .then(() => {
        alert('Vacina atualizada com sucesso! ✅');
        this.fecharEdicao();
      })
      .catch(err => {
        console.error(err);
        alert('Erro ao atualizar.');
      });
  }

  // ── Excluir ──
  excluir(vac: any) {
    const confirmar = confirm(`Excluir "${vac.nome}"?`);
    if (!confirmar) return;
    const ref = doc(this.firestore, 'vacinas', vac.id);
    deleteDoc(ref).catch(err => console.error(err));
  }

  classCard(status: string): string {
    if (status === 'tomada')   return 'em-dia';
    if (status === 'atrasada') return 'atrasada';
    return 'pendente';
  }

  classStatus(status: string): string {
    if (status === 'tomada')   return 'status status-em-dia';
    if (status === 'atrasada') return 'status status-atrasada';
    return 'status status-pendente';
  }

  textoStatus(status: string): string {
    if (status === 'tomada')   return 'Em dia';
    if (status === 'atrasada') return 'Atrasada';
    return 'Pendente';
  }
}