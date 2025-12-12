import { Component, ElementRef, ViewChild, input } from '@angular/core';
import { PdfjsService } from '../services/pdfjs.service';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  templateUrl: './pdf-viewer.component.html',
})
export class PdfViewerComponent {
  file = input<File | null>(null);

  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private pdf: any | null = null;

  pageNumber = 1;
  totalPages = 0;

  constructor(private pdfjsService: PdfjsService) {}

  async ngOnChanges() {
    if (!this.file()) return;
    await this.loadFile(this.file()!);
  }

  private async loadFile(file: File) {
    const pdfjs = await this.pdfjsService.getPdfjs();
    if (!pdfjs) return; // running under SSR/module-runner; do nothing

    this.pageNumber = 1;

    const buffer = await file.arrayBuffer();
    this.pdf = await pdfjs.getDocument({ data: buffer }).promise;

    this.totalPages = this.pdf.numPages;
    await this.renderPage();
  }

  private async renderPage() {
    if (!this.pdf) return;

    const page = await this.pdf.getPage(this.pageNumber);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({
      canvas,
      canvasContext: ctx,
      viewport,
    }).promise;
  }

  async next() {
    if (!this.pdf || this.pageNumber >= this.totalPages) return;
    this.pageNumber++;
    await this.renderPage();
  }

  async prev() {
    if (!this.pdf || this.pageNumber <= 1) return;
    this.pageNumber--;
    await this.renderPage();
  }
}
