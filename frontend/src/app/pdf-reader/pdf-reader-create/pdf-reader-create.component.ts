import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pdf-reader-create',
  standalone: true,
  templateUrl: './pdf-reader-create.component.html',
  styleUrl: './pdf-reader-create.component.css',
  imports: [CommonModule],
})
export class PdfReaderCreateComponent {
  fileSelected = output<File>();

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.fileSelected.emit(file);
    }
  }
}
