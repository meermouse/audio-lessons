import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfListItem } from '../../services/api.service';

@Component({
  selector: 'app-pdf-reader-select',
  standalone: true,
  templateUrl: './pdf-reader-select.component.html',
  styleUrl: './pdf-reader-select.component.css',
  imports: [CommonModule],
})
export class PdfReaderSelectComponent {
  storedPdfs = input<PdfListItem[]>([]);
  pdfIdSelected = output<string>();

  onPdfSelected(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    if (selectElement.value) {
      this.pdfIdSelected.emit(selectElement.value);
    }
  }
}
