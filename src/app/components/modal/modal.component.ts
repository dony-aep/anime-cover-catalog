import { Component, ChangeDetectionStrategy, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent {
  modalService = inject(ModalService);
  
  @ViewChild('modalContent', { read: ViewContainerRef }) set modalContent(vcr: ViewContainerRef | undefined) {
    if (vcr) {
      vcr.clear();
      const modalData = this.modalService.modalData();
      if (modalData) {
        const componentRef = vcr.createComponent(modalData.component);
        Object.assign(componentRef.instance, modalData.context);
      }
    }
  }

  closeModal() {
    this.modalService.close();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
} 