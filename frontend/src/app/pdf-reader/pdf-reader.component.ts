import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfListItem } from '../services/api.service';

@Component({
  selector: 'app-pdf-reader',
  standalone: true,
  templateUrl: './pdf-reader.component.html',
  styleUrl: './pdf-reader.component.css',
  imports: [CommonModule],
})
export class PdfReaderComponent {
  storedPdfs = input<PdfListItem[]>([]);
  fileSelected = output<File>();
  pdfIdSelected = output<string>();

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.fileSelected.emit(file);
    }
  }

  onPdfSelected(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    if (selectElement.value) {
      this.pdfIdSelected.emit(selectElement.value);
    }
  }
}
