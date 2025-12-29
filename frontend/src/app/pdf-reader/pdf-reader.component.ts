import { Component, OnInit, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerComponent } from '../pdf-viewer/pdf-viewer.component';
import { ApiService, PdfListItem } from '../services/api.service';

@Component({
  selector: 'app-pdf-reader',
  standalone: true,
  templateUrl: './pdf-reader.component.html',
  styleUrl: './pdf-reader.component.css',
  imports: [CommonModule, PdfViewerComponent],
})
export class PdfReaderComponent implements OnInit {
  storedPdfs = signal<PdfListItem[]>([]);
  fileSelected = output<File>();
  pdfIdSelected = output<string>();

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadStoredPdfs();
  }

  loadStoredPdfs() {
    this.apiService.listPdfs().subscribe({
      next: (response) => {
        this.storedPdfs.set(response.pdfs || []);
      },
      error: (error) => {
        console.error('Failed to load PDFs:', error);
        this.storedPdfs.set([]);
      }
    });
  }

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
