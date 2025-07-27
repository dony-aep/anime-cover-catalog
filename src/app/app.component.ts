import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { BackToTopButtonComponent } from './components/back-to-top-button/back-to-top-button.component';
import { ModalComponent } from './components/modal/modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    RouterOutlet,
    HeaderComponent,
    BackToTopButtonComponent,
    ModalComponent
  ],
})
export class AppComponent {
  title = 'anime-cover-catalog-angular';
}
