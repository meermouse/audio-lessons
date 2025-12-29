import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerComponent } from '../pdf-viewer/pdf-viewer.component';
import { PdfReaderComponent } from '../pdf-reader/pdf-reader.component';

@Component({
  selector: 'app-pdf-manager',
  standalone: true,
  templateUrl: './pdf-manager.component.html',
  styleUrl: './pdf-manager.component.css',
  imports: [CommonModule, PdfViewerComponent, PdfReaderComponent],
})
export class PdfManagerComponent {
  file = signal<File | null>(null);
  selectedPdfId = signal<string | null>(null);

  onFileSelected(file: File) {
    this.file.set(file);
    this.selectedPdfId.set(null); // Clear PDF ID when uploading new file
    console.log(this.file()?.name);
  }

  onPdfIdSelected(pdfId: string) {
    this.selectedPdfId.set(pdfId);
    this.file.set(null); // Clear file when selecting stored PDF
    console.log(this.file()?.name);
  }
}
