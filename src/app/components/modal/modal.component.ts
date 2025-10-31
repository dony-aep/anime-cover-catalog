import { Component, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
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