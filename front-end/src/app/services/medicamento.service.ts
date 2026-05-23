// services/medicamento.service.ts
import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Observable } from 'rxjs';

export interface RegistroRemedio {
  id?:           string;
  medicamentoId: string;
  nome:          string;
  icone:         string;
  horario:       string;
  dosagem:       string;
  acao:          'tomado' | 'esquecido' | 'adiado';
  dataHora:      Timestamp;
  obs?:          string;
}

export interface RegistroExame {
  id?:      string;
  nome:     string;
  tipo:     'pdf' | 'imagem';
  url:      string;
  tamanho:  string;
  dataHora: Timestamp;
}

@Injectable({ providedIn: 'root' })
export class MedicamentoService {

  private firestore = inject(Firestore);
  private storage   = inject(Storage);
  private injector  = inject(Injector);

  //  Medicamentos
  adicionarMedicamento(medicamento: any) {
    return addDoc(collection(this.firestore, 'medicamentos'), medicamento);
  }

  listarMedicamentos(): Observable<any[]> {
    return this._snapCollection('medicamentos');
  }

  // Vacinas 
  adicionarVacina(vacina: any) {
    return addDoc(collection(this.firestore, 'vacinas'), vacina);
  }

  listarVacinas(): Observable<any[]> {
    return this._snapCollection('vacinas');
  }

  //  Histórico de remédios
  registrarAcao(registro: Omit<RegistroRemedio, 'id'>): Promise<any> {
    return addDoc(collection(this.firestore, 'historico_remedios'), registro);
  }

  listarHistoricoRemedios(dias = 30): Observable<RegistroRemedio[]> {
    return new Observable(sub => {
      const unsub = runInInjectionContext(this.injector, () =>
        onSnapshot(
          query(
            collection(this.firestore, 'historico_remedios'),
            orderBy('dataHora', 'desc')
          ),
          snap => {
            const corte = Date.now() - dias * 24 * 60 * 60 * 1000;
            const dados = snap.docs
              .map(d => ({ id: d.id, ...d.data() } as RegistroRemedio))
              .filter(r => {
                const ts = r.dataHora as any;
                const ms = ts?.toDate ? ts.toDate().getTime() : new Date(ts).getTime();
                return ms >= corte;
              });
            sub.next(dados);
          },
          err => sub.error(err)
        )
      );
      return () => unsub();
    });
  }

  //  Exames 
  async uploadExame(file: File): Promise<void> {
    const path       = `exames/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    const tipo    = file.type === 'application/pdf' ? 'pdf' : 'imagem';
    const kb      = file.size / 1024;
    const tamanho = kb >= 1024
      ? `${(kb / 1024).toFixed(1)} MB`
      : `${kb.toFixed(0)} KB`;

    await addDoc(collection(this.firestore, 'exames'), {
      nome:     file.name.replace(/\.[^/.]+$/, ''),
      tipo,
      url,
      tamanho,
      dataHora: Timestamp.now(),
    });
  }

  listarExames(): Observable<RegistroExame[]> {
    return new Observable(sub => {
      const unsub = runInInjectionContext(this.injector, () =>
        onSnapshot(
          query(
            collection(this.firestore, 'exames'),
            orderBy('dataHora', 'desc')
          ),
          snap => sub.next(snap.docs.map(d => ({ id: d.id, ...d.data() } as RegistroExame))),
          err  => sub.error(err)
        )
      );
      return () => unsub();
    });
  }

  //  Utilitário interno 
  private _snapCollection(col: string): Observable<any[]> {
    return new Observable(sub => {
      const unsub = runInInjectionContext(this.injector, () =>
        onSnapshot(
          query(collection(this.firestore, col)),
          snap => sub.next(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
          err  => sub.error(err)
        )
      );
      return () => unsub();
    });
  }
}