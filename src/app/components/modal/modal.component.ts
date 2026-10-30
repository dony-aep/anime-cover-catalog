import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal',
  imports: [NgComponentOutlet],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()'
  }
})
export class ModalComponent {
  modalService = inject(ModalService);

  closeModal() {
    this.modalService.close();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  onEscape() {
    if (this.modalService.isOpen()) {
      this.closeModal();
    }
  }
}
