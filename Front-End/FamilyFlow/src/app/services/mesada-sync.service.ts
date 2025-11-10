import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MesadaSyncService {
  private reloadMesadaSource = new Subject<void>();
  reloadMesada$ = this.reloadMesadaSource.asObservable();

  triggerReload() {
    this.reloadMesadaSource.next();
  }
}
