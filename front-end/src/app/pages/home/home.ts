import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicamentoService } from '../../services/medicamento.service';
import { Subscription } from 'rxjs';
import { Firestore, doc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {

  private service   = inject(MedicamentoService);
  private cdr       = inject(ChangeDetectorRef);
  private firestore = inject(Firestore);

  medicamentos: any[] = [];
  expandido:    string | null = null;
  carregando    = true;

  private adiados = new Map<string, Date>();
  private tickInterval: any;

  modalEdicao = false;
  idEdicao:   string | null = null;

  formEdicao = {
    nome:    '',
    icone:   '💊',
    dosagem: '',
    horario: '',
    dias:    [] as string[],
    obs:     '',
  };

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

  private sub!: Subscription;

  // ── Medicamento mais próximo do horário atual ──
  get ativo(): any | null {
    const agora     = new Date();
    const diaSemana = this.diaSemanaAtual();

    const candidatos = this.medicamentos
      .filter(m => m.ativo !== false)
      .filter(m => !m.dias || m.dias.length === 0 || m.dias.includes(diaSemana))
      .map(m => {
        const horario = this.adiados.get(m.id) ?? this.horarioHoje(m.horario);
        const diff    = horario.getTime() - agora.getTime();
        return { med: m, horario, diff };
      })
      .filter(c => c.diff > -45 * 60 * 1000)
      .sort((a, b) => a.diff - b.diff);

    return candidatos[0]?.med ?? null;
  }

  // ── Lista ordenada pelo mais próximo do horário atual ──
  get medicamentosOrdenados(): any[] {
    const agora = new Date();
    return [...this.medicamentos].sort((a, b) => {
      const ha = this.adiados.get(a.id) ?? this.horarioHoje(a.horario);
      const hb = this.adiados.get(b.id) ?? this.horarioHoje(b.horario);
      const da = Math.abs(ha.getTime() - agora.getTime());
      const db = Math.abs(hb.getTime() - agora.getTime());
      return da - db;
    });
  }

  // ── Texto do cabeçalho ──
  get textoProximaMedicacao(): string {
    const med = this.ativo;
    if (!med) return 'Nenhuma medicação hoje';

    const agora   = new Date();
    const horario = this.adiados.get(med.id) ?? this.horarioHoje(med.horario);
    const diffMs  = horario.getTime() - agora.getTime();
    const diffMin = Math.round(diffMs / 60000);

    if (diffMin <= 0 && diffMin > -45) return `${med.icone || '💊'} ${med.nome} — tome agora!`;
    if (diffMin <= 0)  return 'Nenhuma medicação pendente';
    if (diffMin < 60)  return `${med.icone || '💊'} ${med.nome} em ${diffMin} minuto${diffMin === 1 ? '' : 's'}`;

    const horas    = Math.floor(diffMin / 60);
    const min      = diffMin % 60;
    const tempoStr = min > 0 ? `${horas}h ${min}min` : `${horas}h`;
    return `${med.icone || '💊'} ${med.nome} em ${tempoStr}`;
  }

  // ── Cabeçalho fica vermelho quando falta 15min ou menos ──
  get cabecalhoUrgente(): boolean {
    const med = this.ativo;
    if (!med) return false;
    const agora   = new Date();
    const horario = this.adiados.get(med.id) ?? this.horarioHoje(med.horario);
    const diffMin = Math.round((horario.getTime() - agora.getTime()) / 60000);
    return diffMin <= 15;
  }

  ngOnInit() {
    this.sub = this.service.listarMedicamentos().subscribe((dados: any[]) => {
      this.medicamentos = [...dados];
      this.carregando   = false;
      this.cdr.detectChanges();
    });

    // Atualiza contador e verifica esquecidos a cada 30 segundos
    this.tickInterval = setInterval(() => {
      this.verificarEsquecidos();
      this.cdr.detectChanges();
    }, 30000);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    clearInterval(this.tickInterval);
  }

  private verificarEsquecidos() {
    const agora     = new Date();
    const diaSemana = this.diaSemanaAtual();

    this.medicamentos
      .filter(m => m.ativo !== false)
      .filter(m => !m.dias || m.dias.length === 0 || m.dias.includes(diaSemana))
      .forEach(m => {
        const horario = this.adiados.get(m.id) ?? this.horarioHoje(m.horario);
        const diffMin = (agora.getTime() - horario.getTime()) / 60000;

        if (diffMin >= 45) {
          this.adiados.delete(m.id);
          this.service.registrarAcao({
            medicamentoId: m.id,
            nome:    m.nome,
            icone:   m.icone   || '💊',
            horario: m.horario || '',
            dosagem: m.dosagem || '',
            acao:    'esquecido',
            dataHora: Timestamp.now(),
          }).catch(() => {});
        }
      });
  }

  toggleExpandir(id: string) {
    this.expandido = this.expandido === id ? null : id;
  }

  formatarDias(dias: string[]): string {
    if (!dias || dias.length === 0) return '';
    const mapa: { [key: string]: string } = {
      dom: 'D', seg: 'S', ter: 'T',
      qua: 'Q', qui: 'Q', sex: 'S', sab: 'S',
    };
    const ordem = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    return ordem.filter(d => dias.includes(d)).map(d => mapa[d]).join(' ');
  }

  tomar(med: any) {
    this.service.registrarAcao({
      medicamentoId: med.id,
      nome:    med.nome,
      icone:   med.icone   || '💊',
      horario: med.horario || '',
      dosagem: med.dosagem || '',
      acao:    'tomado',
      dataHora: Timestamp.now(),
    }).catch(err => console.error('Erro ao registrar tomar:', err));

    this.adiados.delete(med.id);
    this.cdr.detectChanges();
  }

  adiar(med: any) {
    const base        = this.adiados.get(med.id) ?? this.horarioHoje(med.horario);
    const novoHorario = new Date(base.getTime() + 15 * 60 * 1000);
    this.adiados.set(med.id, novoHorario);

    this.service.registrarAcao({
      medicamentoId: med.id,
      nome:    med.nome,
      icone:   med.icone   || '💊',
      horario: med.horario || '',
      dosagem: med.dosagem || '',
      acao:    'adiado',
      dataHora: Timestamp.now(),
    }).catch(err => console.error('Erro ao registrar adiar:', err));

    this.cdr.detectChanges();
  }

  private horarioHoje(horario: string): Date {
    if (!horario) return new Date();
    const [h, m] = horario.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }

  private diaSemanaAtual(): string {
    const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    return dias[new Date().getDay()];
  }

  abrirEdicao(med: any) {
    this.idEdicao = med.id;
    this.formEdicao = {
      nome:    med.nome    || '',
      icone:   med.icone   || '💊',
      dosagem: med.dosagem || '',
      horario: med.horario || '',
      dias:    med.dias    ? [...med.dias] : [],
      obs:     med.obs     || '',
    };
    this.modalEdicao = true;
    this.expandido   = null;
  }

  fecharEdicao() {
    this.modalEdicao = false;
    this.idEdicao    = null;
  }

  toggleDia(valor: string) {
    const i = this.formEdicao.dias.indexOf(valor);
    if (i >= 0) this.formEdicao.dias.splice(i, 1);
    else        this.formEdicao.dias.push(valor);
  }

  salvarEdicao() {
    if (!this.formEdicao.nome || !this.formEdicao.horario) {
      alert('Preencha ao menos o nome e o horário.');
      return;
    }
    const r = doc(this.firestore, 'medicamentos', this.idEdicao!);
    updateDoc(r, { ...this.formEdicao })
      .then(() => { alert('Medicamento atualizado! ✅'); this.fecharEdicao(); })
      .catch(err => { console.error(err); alert('Erro ao atualizar.'); });
  }

  excluir(med: any) {
    if (!confirm(`Excluir "${med.nome}"?`)) return;
    deleteDoc(doc(this.firestore, 'medicamentos', med.id))
      .catch(err => console.error(err));
  }
}