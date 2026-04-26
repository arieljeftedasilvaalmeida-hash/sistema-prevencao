// historico/historico.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
 
@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './historico.html',
  styleUrl: './historico.css',
})
export class Historico implements OnInit {
 
  constructor(private router: Router) {}
 
  ngOnInit() {
    // Se acessar /historico sem subrota, vai direto para /historico/remedios
    if (this.router.url === '/historico') {
      this.router.navigate(['/historico/remedios']);
    }
  }
}