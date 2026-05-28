import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicamentoService } from '../../services/medicamento.service';
import { Subscription } from 'rxjs';
import { Firestore, doc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { Timestamp } from '@angular/fire/firestore';

// ── Chaves do localStorage ────────────────────────────────────────────────────
const LS_TOMADOS  = 'med_tomados';   // Set<string> serializado como JSON array
const LS_ADIADOS  = 'med_adiados';   // Map<id, isoString> serializado como JSON object

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

  // Persistidos no localStorage
  private adiados         = new Map<string, Date>();   // id -> horário adiado
  private registradosHoje = new Set<string>();         // chaves de tomado/esquecido

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

  icones    = ['💊', '💉', '🩺', '🧴', '🩹', '💧', '🌡️', '🧪'];
  diasSemana = [
    { letra: 'D', valor: 'dom' }, { letra: 'S', valor: 'seg' },
    { letra: 'T', valor: 'ter' }, { letra: 'Q', valor: 'qua' },
    { letra: 'Q', valor: 'qui' }, { letra: 'S', valor: 'sex' },
    { letra: 'S', valor: 'sab' },
  ];

  private sub!: Subscription;

  // ── Persistência localStorage ─────────────────────────────────────────────

  private carregarStorage() {
    const hoje = this.dataHoje();

    // -- Tomados/Esquecidos: só carrega entradas de HOJE -----------------
    try {
      const raw: string[] = JSON.parse(localStorage.getItem(LS_TOMADOS) || '[]');
      // Filtra exatamente pela data local de hoje no formato YYYY-MM-DD
      // Chave começa com a data: `{YYYY-MM-DD}|{medId}_tomado`
      this.registradosHoje = new Set(raw.filter(k => k.startsWith(`${hoje}|`)));
    } catch { this.registradosHoje = new Set(); }

    // -- Adiamentos: descarta se a data do adiamento já passou -----------
    try {
      const raw: Record<string, string> = JSON.parse(localStorage.getItem(LS_ADIADOS) || '{}');
      const agora = new Date();
      this.adiados = new Map();
      for (const [id, iso] of Object.entries(raw)) {
        const d = new Date(iso);
        const dData = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        // Mantém apenas adiamentos de hoje que ainda fazem sentido (janela de 45min)
        if (dData === hoje && d.getTime() > agora.getTime() - 45 * 60 * 1000) {
          this.adiados.set(id, d);
        }
      }
    } catch { this.adiados = new Map(); }
  }

  private salvarTomados() {
    // Salva apenas entradas de hoje — chave começa com a data
    const hoje = this.dataHoje();
    const apenasHoje = [...this.registradosHoje].filter(k => k.startsWith(`${hoje}|`));
    localStorage.setItem(LS_TOMADOS, JSON.stringify(apenasHoje));
  }

  private salvarAdiados() {
    const obj: Record<string, string> = {};
    this.adiados.forEach((d, id) => { obj[id] = d.toISOString(); });
    localStorage.setItem(LS_ADIADOS, JSON.stringify(obj));
  }

  /** Limpa o localStorage manualmente (útil para debug ou reset) */
  limparStorage() {
    localStorage.removeItem(LS_TOMADOS);
    localStorage.removeItem(LS_ADIADOS);
    this.registradosHoje = new Set();
    this.adiados = new Map();
    this.cdr.detectChanges();
  }

  // ── Helpers de data ───────────────────────────────────────────────────────

  private dataHoje(): string {
    // Usa horário LOCAL para não virar dia antes da meia-noite no Brasil (UTC-3)
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private chaveHoje(medId: string): string {
    // Formato: `{YYYY-MM-DD}|{medId}` — data na frente facilita o filtro
    return `${this.dataHoje()}|${medId}`;
  }

  private jaTomadoHoje(med: any): boolean {
    return this.registradosHoje.has(this.chaveHoje(med.id) + '_tomado');
  }

  private nomeDia(d: Date): string {
    return ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][d.getDay()];
  }

  private horarioHoje(horario: string): Date {
    if (!horario) return new Date();
    const [h, m] = horario.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }

  /**
   * Retorna o timestamp absoluto da próxima ocorrência do medicamento.
   * Varre de hoje até +7 dias procurando um dia válido.
   * - i=0 (hoje): usa adiamento se houver; se passou a janela de 45min, pula.
   * - i>0 (futuro): retorna horário fixo naquele dia.
   * - Se já tomou hoje, começa em i=1.
   */
  private proximaOcorrencia(med: any, agora: Date): Date {
    const [h, m] = (med.horario || '00:00').split(':').map(Number);

    // Monta a data de um dia específico sem acumular erro de horário
    const montarData = (diasAFrente: number): Date => {
      const base = new Date(agora);
      base.setHours(0, 0, 0, 0);           // zera para meia-noite de hoje
      base.setDate(base.getDate() + diasAFrente);
      base.setHours(h, m, 0, 0);
      return base;
    };

    const iniciarEm = this.jaTomadoHoje(med) ? 1 : 0;

    for (let i = iniciarEm; i <= 7; i++) {
      const candidato = montarData(i);
      const diaValido = !med.dias || med.dias.length === 0 || med.dias.includes(this.nomeDia(candidato));
      if (!diaValido) continue;

      if (i === 0) {
        const efetivo   = this.adiados.get(med.id) ?? candidato;
        const passouMin = (agora.getTime() - efetivo.getTime()) / 60000;
        if (efetivo.getTime() >= agora.getTime()) return efetivo; // futuro
        if (passouMin <= 45) return efetivo;                      // janela ativa
        continue;                                                  // passou → próximo dia
      }

      return candidato; // dia futuro válido
    }

    return montarData(0); // fallback
  }

  // ── Getters reativos ──────────────────────────────────────────────────────

  get ativo(): any | null {
    const agora   = new Date();
    const diaNome = this.nomeDia(agora);

    return this.medicamentos
      .filter(m => m.ativo !== false && !this.jaTomadoHoje(m))
      .map(m => {
        const diaValido = !m.dias || m.dias.length === 0 || m.dias.includes(diaNome);
        const horario   = this.adiados.get(m.id) ?? this.horarioHoje(m.horario);
        const diff      = horario.getTime() - agora.getTime();
        return { med: m, diff, diaValido };
      })
      .filter(c => c.diaValido && c.diff >= -45 * 60 * 1000 && c.diff <= 30 * 60 * 1000)
      .sort((a, b) => a.diff - b.diff)[0]?.med ?? null;
  }

  get medicamentosOrdenados(): any[] {
    const agora = new Date();
    // Ordena todos pela próxima ocorrência real.
    // proximaOcorrencia() já começa em i=1 para medicamentos tomados hoje,
    // então eles naturalmente ficam atrás dos que ainda precisam ser tomados hoje,
    // mas na frente de medicamentos com próxima ocorrência mais distante.
    return [...this.medicamentos].sort((a, b) => {
      return this.proximaOcorrencia(a, agora).getTime() - this.proximaOcorrencia(b, agora).getTime();
    });
  }

  deveMostrarAcoes(med: any): boolean {
    if (med.ativo === false || this.jaTomadoHoje(med)) return false;
    const agora   = new Date();
    const diaValido = !med.dias || med.dias.length === 0 || med.dias.includes(this.nomeDia(agora));
    if (!diaValido) return false;
    const horario = this.adiados.get(med.id) ?? this.horarioHoje(med.horario);
    const diffMin = (horario.getTime() - agora.getTime()) / 60000;
    return diffMin <= 30 && diffMin >= -45;
  }

  /** Horário exibido no card: mostra o horário adiado com ícone se houver */
  horarioExibido(med: any): string {
    const adiado = this.adiados.get(med.id);
    if (!adiado) return med.horario || '';
    const h = adiado.getHours().toString().padStart(2, '0');
    const m = adiado.getMinutes().toString().padStart(2, '0');
    return `${h}:${m} ⏰`;
  }

  get textoProximaMedicacao(): string {
    const agora = new Date();

    // Se tem medicamento na janela ativa (tome agora / falta até 30min) → prioridade
    const ativoAgora = this.ativo;
    if (ativoAgora) {
      const horario = this.adiados.get(ativoAgora.id) ?? this.horarioHoje(ativoAgora.horario);
      const diffMin = Math.round((horario.getTime() - agora.getTime()) / 60000);
      if (diffMin <= 0) return `${ativoAgora.icone || '💊'} ${ativoAgora.nome} — tome agora!`;
      if (diffMin < 60) return `${ativoAgora.icone || '💊'} ${ativoAgora.nome} em ${diffMin} min`;
      const h = Math.floor(diffMin / 60), mn = diffMin % 60;
      return `${ativoAgora.icone || '💊'} ${ativoAgora.nome} em ${h}h${mn > 0 ? ` ${mn}min` : ''}`;
    }

    // Caso contrário: usa o primeiro da lista ordenada (já calcula próxima ocorrência real)
    const primeiro = this.medicamentosOrdenados.find(m => m.ativo !== false);
    if (!primeiro) return 'Nenhuma medicação cadastrada';

    const prox    = this.proximaOcorrencia(primeiro, agora);
    const diffMin = Math.round((prox.getTime() - agora.getTime()) / 60000);
    if (diffMin <= 0) return `${primeiro.icone || '💊'} ${primeiro.nome} — tome agora!`;
    if (diffMin < 60) return `${primeiro.icone || '💊'} ${primeiro.nome} em ${diffMin} min`;
    const h = Math.floor(diffMin / 60), mn = diffMin % 60;
    return `${primeiro.icone || '💊'} ${primeiro.nome} em ${h}h${mn > 0 ? ` ${mn}min` : ''}`;
  }

  get cabecalhoUrgente(): boolean {
    const med = this.ativo;
    if (!med) return false;
    const horario = this.adiados.get(med.id) ?? this.horarioHoje(med.horario);
    return Math.round((horario.getTime() - new Date().getTime()) / 60000) <= 15;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit() {
    this.carregarStorage(); // 👈 carrega estado persistido antes de tudo

    this.sub = this.service.listarMedicamentos().subscribe((dados: any[]) => {
      this.medicamentos = [...dados];
      this.carregando   = false;
      this.cdr.detectChanges();
    });

    this.tickInterval = setInterval(() => {
      this.verificarEsquecidos();
      this.cdr.detectChanges();
    }, 30_000);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    clearInterval(this.tickInterval);
  }

  // ── Verificar esquecidos ──────────────────────────────────────────────────

  private verificarEsquecidos() {
    const agora   = new Date();
    const diaNome = this.nomeDia(agora);

    this.medicamentos
      .filter(m => m.ativo !== false)
      .filter(m => !m.dias || m.dias.length === 0 || m.dias.includes(diaNome))
      .forEach(m => {
        const horario    = this.adiados.get(m.id) ?? this.horarioHoje(m.horario);
        const passouMin  = (agora.getTime() - horario.getTime()) / 60000;
        const chaveTomado    = this.chaveHoje(m.id) + '_tomado';
        const chaveEsquecido = this.chaveHoje(m.id) + '_esquecido';

        if (passouMin >= 45 && !this.registradosHoje.has(chaveTomado) && !this.registradosHoje.has(chaveEsquecido)) {
          this.registradosHoje.add(chaveEsquecido);
          this.adiados.delete(m.id);
          this.salvarTomados();
          this.salvarAdiados();
          this.service.registrarAcao({
            medicamentoId: m.id,
            nome: m.nome, icone: m.icone || '💊',
            horario: m.horario || '', dosagem: m.dosagem || '',
            acao: 'esquecido', dataHora: Timestamp.now(),
          }).catch(() => {});
        }
      });
  }

  // ── Ações do usuário ──────────────────────────────────────────────────────

  toggleAtivo(med: any, event: Event) {
    event.stopPropagation();
    const novoValor = !(med.ativo !== false);
    updateDoc(doc(this.firestore, 'medicamentos', med.id), { ativo: novoValor })
      .then(() => { med.ativo = novoValor; this.cdr.detectChanges(); })
      .catch(console.error);
  }

  tomar(med: any) {
    const chave = this.chaveHoje(med.id) + '_tomado';
    if (this.registradosHoje.has(chave)) return;

    this.registradosHoje.add(chave);
    this.adiados.delete(med.id);
    this.salvarTomados(); // 👈 persiste
    this.salvarAdiados(); // 👈 persiste

    this.service.registrarAcao({
      medicamentoId: med.id,
      nome: med.nome, icone: med.icone || '💊',
      horario: med.horario || '', dosagem: med.dosagem || '',
      acao: 'tomado', dataHora: Timestamp.now(),
    }).catch(console.error);

    this.cdr.detectChanges();
  }

  adiar(med: any) {
    const base = this.adiados.get(med.id) ?? this.horarioHoje(med.horario);
    this.adiados.set(med.id, new Date(base.getTime() + 15 * 60 * 1000));
    this.salvarAdiados(); // 👈 persiste

    this.service.registrarAcao({
      medicamentoId: med.id,
      nome: med.nome, icone: med.icone || '💊',
      horario: med.horario || '', dosagem: med.dosagem || '',
      acao: 'adiado', dataHora: Timestamp.now(),
    }).catch(console.error);

    this.cdr.detectChanges();
  }

  // ── Edição/exclusão ───────────────────────────────────────────────────────

  toggleExpandir(id: string) { this.expandido = this.expandido === id ? null : id; }

  formatarDias(dias: string[]): string {
    if (!dias || dias.length === 0) return 'Todos os dias';
    const mapa: Record<string, string> = { dom:'D', seg:'S', ter:'T', qua:'Q', qui:'Q', sex:'S', sab:'S' };
    return ['dom','seg','ter','qua','qui','sex','sab'].filter(d => dias.includes(d)).map(d => mapa[d]).join(' ');
  }

  abrirEdicao(med: any) {
    this.idEdicao   = med.id;
    this.formEdicao = {
      nome: med.nome || '', icone: med.icone || '💊', dosagem: med.dosagem || '',
      horario: med.horario || '', dias: med.dias ? [...med.dias] : [], obs: med.obs || '',
    };
    this.modalEdicao = true;
    this.expandido   = null;
  }

  fecharEdicao() { this.modalEdicao = false; this.idEdicao = null; }

  toggleDia(valor: string) {
    const i = this.formEdicao.dias.indexOf(valor);
    if (i >= 0) this.formEdicao.dias.splice(i, 1); else this.formEdicao.dias.push(valor);
  }

  salvarEdicao() {
    if (!this.formEdicao.nome || !this.formEdicao.horario) {
      alert('Preencha ao menos o nome e o horário.'); return;
    }
    updateDoc(doc(this.firestore, 'medicamentos', this.idEdicao!), { ...this.formEdicao })
      .then(() => { alert('Medicamento atualizado! ✅'); this.fecharEdicao(); })
      .catch(err => { console.error(err); alert('Erro ao atualizar.'); });
  }

  excluir(med: any) {
    if (!confirm(`Excluir "${med.nome}"?`)) return;
    deleteDoc(doc(this.firestore, 'medicamentos', med.id)).catch(console.error);
  }
}