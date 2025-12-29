import { Component } from '@angular/core';
import { PdfReaderComponent } from './pdf-reader/pdf-reader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [PdfReaderComponent],
})
export class AppComponent {}
