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
  fileUploaded = output<string>(); // New output for when file is uploaded with page range

  activeTab = signal<'select' | 'create'>('select');

  onFileSelected(file: File) {
    this.fileSelected.emit(file);
  }

  onPdfIdSelected(pdfId: string) {
    this.pdfIdSelected.emit(pdfId);
  }

  onFileUploaded(pdfId: string) {
    this.fileUploaded.emit(pdfId);
  }

  setActiveTab(tab: 'select' | 'create') {
    this.activeTab.set(tab);
  }
}
