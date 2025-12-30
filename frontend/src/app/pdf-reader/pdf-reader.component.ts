import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfListItem } from '../services/api.service';
import { PdfReaderCreateComponent } from './pdf-reader-create/pdf-reader-create.component';
import { PdfReaderSelectComponent } from './pdf-reader-select/pdf-reader-select.component';

@Component({
  selector: 'app-pdf-reader',
  standalone: true,
  templateUrl: './pdf-reader.component.html',
  styleUrl: './pdf-reader.component.css',
  imports: [CommonModule, PdfReaderCreateComponent, PdfReaderSelectComponent],
})
export class PdfReaderComponent {
  storedPdfs = input<PdfListItem[]>([]);
  fileSelected = output<File>();
  pdfIdSelected = output<string>();

  activeTab = signal<'select' | 'create'>('select');

  onFileSelected(file: File) {
    this.fileSelected.emit(file);
  }

  onPdfIdSelected(pdfId: string) {
    this.pdfIdSelected.emit(pdfId);
  }

  setActiveTab(tab: 'select' | 'create') {
    this.activeTab.set(tab);
  }
}
