import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';
import { ApiService, PdfListItem } from './services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [ CommonModule, PdfViewerComponent ],
})

export class AppComponent implements OnInit {
  file: File | null = null;
  storedPdfs: PdfListItem[] = [];
  selectedPdfId: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadStoredPdfs();
  }

  loadStoredPdfs() {
    this.apiService.listPdfs().subscribe({
      next: (response) => {
        this.storedPdfs = response.pdfs;
      },
      error: (error) => {
        console.error('Failed to load PDFs:', error);
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
