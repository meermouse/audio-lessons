import { Component, OnInit, signal } from '@angular/core';
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
  file: File | null = null;
  storedPdfs = signal<PdfListItem[]>([]);
  selectedPdfId: string | null = null;

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
    this.file = input.files?.[0] ?? null;
  }

  onPdfSelected(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedPdfId = selectElement.value;
    this.file = null; // Clear file selection when using stored PDF
  }
}
