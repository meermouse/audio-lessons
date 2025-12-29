import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerComponent } from '../pdf-viewer/pdf-viewer.component';
import { PdfReaderComponent } from '../pdf-reader/pdf-reader.component';
import { ApiService, PdfListItem } from '../services/api.service';

@Component({
  selector: 'app-pdf-manager',
  standalone: true,
  templateUrl: './pdf-manager.component.html',
  styleUrl: './pdf-manager.component.css',
  imports: [CommonModule, PdfViewerComponent, PdfReaderComponent],
})
export class PdfManagerComponent implements OnInit {
  file = signal<File | null>(null);
  selectedPdfId = signal<string | null>(null);
  storedPdfs = signal<PdfListItem[]>([]);

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
      },
    });
  }

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

  onPageRangeSubmitted(event: { pdf_id: string; from_page: number; to_page: number }) {
    console.log('Page range submitted:', event);
    // Handle the submission here - e.g., call API to create a job
    this.apiService.createJob({
      pdf_id: event.pdf_id,
      from_page: event.from_page,
      to_page: event.to_page
    }).subscribe({
      next: (response) => {
        console.log('Job creation response:', response);
      },
      error: (error) => {
        console.error('Failed to create job:', error);
      }
    });
  }
}
