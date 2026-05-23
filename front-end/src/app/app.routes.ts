// app.routes.ts
import { Routes } from '@angular/router';

import { Home }      from './pages/home/home';
import { Medicamentos } from './pages/medicamentos/medicamentos';
import { Vacinas }   from './pages/vacinas/vacinas';
import { Historico } from './pages/historico/historico';
import { Risco }     from './pages/risco/risco';
import { Perfil }    from './pages/perfil/perfil';

import { HistoricoRemedios } from './pages/historico/remedios/remedios';
import { HistoricoVacinas }  from './pages/historico/vacinas/vacinas';
import { HistoricoRisco }    from './pages/historico/risco/risco';
import { HistoricoExames }   from './pages/historico/exames/exames';

export const routes: Routes = [

  { path: '',          component: Home      },
  { path: 'medicamentos', component: Medicamentos },
  { path: 'vacinas',   component: Vacinas   },
  { path: 'risco',     component: Risco     },
  { path: 'perfil',    component: Perfil    },

  {
    path: 'historico',
    component: Historico,
    children: [
      { path: '',         redirectTo: 'remedios', pathMatch: 'full' },
      { path: 'remedios', component: HistoricoRemedios },
      { path: 'vacinas',  component: HistoricoVacinas  },
      { path: 'risco',    component: HistoricoRisco    },
      { path: 'exames',   component: HistoricoExames   },
    ],
  },

];