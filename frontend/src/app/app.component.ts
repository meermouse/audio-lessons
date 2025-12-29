import { Component } from '@angular/core';
import { PdfManagerComponent } from './pdf-manager/pdf-manager.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [PdfManagerComponent],
})
export class AppComponent {}
