// Importa o tipo de configuração da aplicação Angular
import { ApplicationConfig } from '@angular/core';

// Importa o sistema de rotas
import { provideRouter } from '@angular/router';

// Importa suas rotas definidas no projeto
import { routes } from './app.routes';

// 🔥 IMPORTAÇÕES DO FIREBASE
// Função para inicializar o Firebase
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';

// Função para usar o Firestore (banco de dados)
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

// 🔥 IMPORTA SEU environment (onde está o firebaseConfig)
import { environment } from '../environments/environment';


// 🔥 CONFIGURAÇÃO PRINCIPAL DO APP
export const appConfig: ApplicationConfig = {
  providers: [

    // 👉 Habilita as rotas do Angular
    provideRouter(routes),

    // 🔥 INICIALIZA O FIREBASE
    // Aqui ele conecta seu app Angular com o Firebase usando suas credenciais
    provideFirebaseApp(() => initializeApp(environment.firebase)),

    // 🔥 ATIVA O FIRESTORE (BANCO DE DADOS)
    // Isso permite salvar e buscar dados no Firebase
    provideFirestore(() => getFirestore())

  ]
};