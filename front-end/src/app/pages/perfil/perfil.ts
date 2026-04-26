import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
 
@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
 
  // dados do usuário
  usuario = {
    nome:          'Ariel Jéfte',
    email:         'ariel.jefte@email.com',
    idade:         19,
    tipoSanguineo: 'O+',
    peso:          70,
    altura:        186,
  };
 
  // iniciais do nome para avatar
  get iniciais(): string {
    return this.usuario.nome
      .split(' ')
      .map(p => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
 
  // preferências do usuário
  prefs = {
    notificacoes:  true,
    horarioPadrao: '08:00',
    temaEscuro:    false,
    fonteMaior:    false,
    idioma:        'Português (BR)',
  };
 
  // ações
  trocarFoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) console.log('Foto selecionada:', file.name);
    };
  }
 
  editarDados() {
    // Navegar para tela de edição ou abrir modal
    console.log('Editar dados pessoais');
  }
 
  editarHorario() {
    // Abrir seletor de horário
    console.log('Editar horário padrão');
  }
 
  editarIdioma() {
    // Abrir seletor de idioma
    console.log('Editar idioma');
  }
 
  sair() {
    // Limpar sessão e redirecionar para login
    console.log('Sair da conta');
  }
 
}
