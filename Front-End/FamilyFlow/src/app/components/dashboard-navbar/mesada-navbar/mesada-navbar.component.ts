// ...removido log fora de método...
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mesada-navbar',
  templateUrl: './mesada-navbar.component.html',
  styleUrls: ['./mesada-navbar.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe]
})
export class MesadaNavbarComponent implements OnInit {
  saldoAtual: number = 0;
  ultimaTarefa: { titulo: string, valor: number } | null = null;
  historico: Array<{ titulo: string, valor: number, data: Date }> = [];
  prioridades = [
    { nome: 'Baixa', valor: 1 },
    { nome: 'Média', valor: 2 },
    { nome: 'Alta', valor: 3 }
  ];
  isAdmin: boolean = false;
  membros: Array<{ id: number, nome: string, role: string }> = [];
  membroSelecionado: number | null = null;
  ajusteValor: number = 0;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.carregarHistorico();
    this.carregarPrioridades();
    this.carregarMembros();
    // Definir isAdmin igual ao task-navbar
    this.http.get<{familia: any}>(`${environment.apiUrl}/family/info`, { withCredentials: true }).subscribe({
      next: (response: any) => {
        this.isAdmin = response.familia?.role === 'ADMIN';
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao verificar papel do usuário na família:', error);
      }
    });
  }

  carregarSaldo() {
    this.http.get<any>(`${environment.apiUrl}/allowance/saldo`, { withCredentials: true }).subscribe({
      next: (res) => {
        this.saldoAtual = res.saldo || 0;
        // Backend retorna 'ultima', não 'ultimaTarefa'
        this.ultimaTarefa = res.ultima || null;
      },
      error: () => { this.saldoAtual = 0; this.ultimaTarefa = null; }
    });
  }

  carregarHistorico() {
    this.http.get<any>(`${environment.apiUrl}/allowance/historico`, { withCredentials: true }).subscribe({
      next: (res) => {
        this.historico = (res.historico || []).map((t: any) => ({
          titulo: t.title,
          valor: t.reward_value,
          data: t.date_end
        }));
      },
      error: () => { this.historico = []; }
    });
  }

  carregarPrioridades() {
    this.http.get<any>(`${environment.apiUrl}/allowance/prioridades`, { withCredentials: true }).subscribe({
      next: (res) => {
        if (res.prioridades && typeof res.prioridades === 'object') {
          this.prioridades = [
            { nome: 'Baixa', valor: res.prioridades.valor_baixa ?? res.prioridades.BAIXA ?? 1 },
            { nome: 'Média', valor: res.prioridades.valor_media ?? res.prioridades.MEDIA ?? 2 },
            { nome: 'Alta', valor: res.prioridades.valor_alta ?? res.prioridades.ALTA ?? 3 }
          ];
        } else {
          this.prioridades = this.prioridades;
        }
        if (typeof res.saldo === 'number') {
          this.saldoAtual = res.saldo;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('[FRONT DEBUG] erro /allowance/prioridades:', err);
      }
    });
  }

  carregarMembros() {
    this.http.get<any>(`${environment.apiUrl}/allowance/membros`, { withCredentials: true }).subscribe({
      next: (res) => {
  this.membros = res.membros || [];
  this.cdr.detectChanges();
      },
      error: () => { this.membros = []; }
    });
  }

  salvarTabela() {
    if (!this.isAdmin) return;
    this.http.put(`${environment.apiUrl}/allowance/prioridades`, { prioridades: this.prioridades }, { withCredentials: true }).subscribe();
  }

  ajustarSaldo() {
    if (!this.isAdmin || !this.membroSelecionado) return;
    this.http.patch(`${environment.apiUrl}/allowance/saldo`, {
      membroId: this.membroSelecionado,
      valor: this.ajusteValor
    }, { withCredentials: true }).subscribe(() => {
      this.carregarSaldo();
    });
  }
}
