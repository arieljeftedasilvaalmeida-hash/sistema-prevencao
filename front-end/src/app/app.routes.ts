// Importa o tipo Routes (estrutura de rotas do Angular)
import { Routes } from '@angular/router';

// Importa os componentes (telas) do sistema
import { Home } from './pages/home/home';
import { Medicamentos } from './pages/medicamentos/medicamentos';
import { Vacinas } from './pages/vacinas/vacinas';
import { Historico } from './pages/historico/historico';
import { Risco } from './pages/risco/risco';
import { Perfil } from './pages/perfil/perfil';

// Componentes filhos do histórico
import { HistoricoRemedios } from './pages/historico/remedios/remedios';
import { HistoricoVacinas }  from './pages/historico/vacinas/vacinas';
import { HistoricoRisco }    from './pages/historico/risco/risco';
import { HistoricoExames }   from './pages/historico/exames/exames';

// Define todas as rotas da aplicação
export const routes: Routes = [

  // Rota principal (quando acessar "/")
  // Ex: http://localhost:4200
  { path: '', component: Home },

  // Rota para a página de medicamentos
  // Ex: http://localhost:4200/medicamentos
  { path: 'medicamentos', component: Medicamentos },

  // Rota para a página de vacinas
  // Ex: http://localhost:4200/vacinas
  { path: 'vacinas', component: Vacinas },

  // Rota para a página de histórico
  // Ex: http://localhost:4200/historico
  { path: 'historico', component: Historico },

  // Rota para a página de análise de risco
  // Ex: http://localhost:4200/risco
  { path: 'risco', component: Risco },

  // Rota para a página de perfil do usuário
  // Ex: http://localhost:4200/perfil
  { path: 'perfil', component: Perfil },

  {
    path: 'historico',
    component: Historico,
    children: [
      { path: '',        redirectTo: 'remedios', pathMatch: 'full' },
      { path: 'remedios', component: HistoricoRemedios },
      { path: 'vacinas',  component: HistoricoVacinas  },
      { path: 'risco',    component: HistoricoRisco    },
      { path: 'exames',   component: HistoricoExames   },
    ]
  }
];