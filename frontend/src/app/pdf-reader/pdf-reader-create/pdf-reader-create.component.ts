import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-pdf-reader-create',
  standalone: true,
  templateUrl: './pdf-reader-create.component.html',
  styleUrl: './pdf-reader-create.component.css',
  imports: [CommonModule],
})
export class PdfReaderCreateComponent {
  fileSelected = output<File>();
  fileUploaded = output<string>(); // Emits pdf_id after upload

  uploadInProgress = false;

  constructor(private apiService: ApiService) {}

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.fileSelected.emit(file);
    }
  }

  onUpload(file: HTMLInputElement) {
    const selectedFile = file.files?.[0];
    if (!selectedFile) return;

    this.uploadInProgress = true;

    this.apiService.uploadPdf(selectedFile).subscribe({
      next: (response) => {
        console.log('Upload response:', response);
        if (response.pdf_id) {
          this.fileUploaded.emit(response.pdf_id);
          this.uploadInProgress = false;
          file.value = ''; // Clear file input
        }
      },
      error: (error) => {
        console.error('Upload failed:', error);
        this.uploadInProgress = false;
      }
    });
  }
}
