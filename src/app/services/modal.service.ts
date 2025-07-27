import { Injectable, signal, Type } from '@angular/core';

export interface ModalData {
  component: Type<any>;
  context: any;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  isOpen = signal<boolean>(false);
  modalData = signal<ModalData | null>(null);

  open(component: Type<any>, context: any) {
    this.modalData.set({ component, context });
    this.isOpen.set(true);
    document.body.classList.add('modal-open');
  }

  close() {
    this.isOpen.set(false);
    this.modalData.set(null);
    document.body.classList.remove('modal-open');
  }
} 