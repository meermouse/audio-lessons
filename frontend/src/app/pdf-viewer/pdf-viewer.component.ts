import { Component, ElementRef, ViewChild, input, OnDestroy, effect, signal } from '@angular/core';
import { from, Subject, switchMap, takeUntil, filter } from 'rxjs';
import { PdfjsService } from '../services/pdfjs.service';
import { PDFDocumentProxy } from 'pdfjs-dist';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  templateUrl: './pdf-viewer.component.html',
})
export class PdfViewerComponent implements OnDestroy {
  file = input<File | null>(null);

  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private pdf: PDFDocumentProxy | null = null;
  private destroy$ = new Subject<void>();

  pageNumber = signal(1);
  totalPages = signal(0);

  constructor(private pdfjsService: PdfjsService) {
    effect(() => {
      const file = this.file();
      if (!file) return;

      this.pdfjsService
        .getPdfjs()
        .pipe(
          filter(Boolean),
          switchMap((pdfjs) =>
            from(file.arrayBuffer()).pipe(
              switchMap((buffer) =>
                from(pdfjs.getDocument({ data: buffer }).promise)
              )
            )
          ),
          takeUntil(this.destroy$)
        )
        .subscribe((pdf) => {
          this.pdf = pdf;
          this.pageNumber.set(1);
          this.totalPages.set(pdf.numPages);
          console.log('Total pages:', this.totalPages());
          this.renderPage();
        });
    });
  }

  private renderPage() {
    if (!this.pdf) return;

    from(this.pdf.getPage(this.pageNumber()))
      .pipe(
        switchMap((page: any) => {
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = this.canvasRef.nativeElement;
          const ctx = canvas.getContext('2d');
          if (!ctx) return [];

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          return from(
            page.render({
              canvas,
              canvasContext: ctx,
              viewport,
            }).promise
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  next() {
    if (!this.pdf || this.pageNumber() >= this.totalPages()) return;
    this.pageNumber.update(n => n + 1);
    this.renderPage();
  }

  prev() {
    if (!this.pdf || this.pageNumber() <= 1) return;
    this.pageNumber.update(n => n - 1);
    this.renderPage();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
