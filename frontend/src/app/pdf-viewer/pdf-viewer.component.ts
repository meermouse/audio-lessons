import { Component, ElementRef, ViewChild, input, OnDestroy, effect, signal, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { from, Subject, switchMap, takeUntil, filter } from 'rxjs';
import { PdfjsService } from '../services/pdfjs.service';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './pdf-viewer.component.html',
})
export class PdfViewerComponent implements OnDestroy {
  file = input<File | null>(null);
  pdfId = input<string | null>(null);

  pageRangeSubmitted = output<{ pdf_id: string; from_page: number; to_page: number }>();

  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private pdf: PDFDocumentProxy | null = null;
  private destroy$ = new Subject<void>();

  pageNumber = signal(1);
  totalPages = signal(0);
  rangeForm = signal<any>(null);

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private pdfjsService: PdfjsService
  ) {
    this.rangeForm.set(
      this.fb.group(
        {
          fromPage: this.fb.control<number | null>(null, {
            validators: [Validators.required, Validators.min(1)],
          }),
          toPage: this.fb.control<number | null>(null, {
            validators: [Validators.required, Validators.min(1)],
          }),
        },
        { validators: [this.pageRangeValidator()] }
      )
    );
    effect(() => {
      const file = this.file();
      const pdfId = this.pdfId();
      
      if (!file && !pdfId) return;

      let loadPdf$;
      
      if (file) {
        // Load from uploaded file
        loadPdf$ = this.pdfjsService
          .getPdfjs()
          .pipe(
            filter(Boolean),
            switchMap((pdfjs) =>
              from(file.arrayBuffer()).pipe(
                switchMap((buffer) =>
                  from(pdfjs.getDocument({ data: buffer }).promise)
                )
              )
            )
          );
      } else if (pdfId) {
        // Load from stored PDF
        loadPdf$ = this.pdfjsService
          .getPdfjs()
          .pipe(
            filter(Boolean),
            switchMap((pdfjs) =>
              // Fetch the stored PDF file from storage endpoint
              from(fetch(`http://localhost:8000/storage/pdfs/${pdfId}.pdf`).then(r => r.arrayBuffer())).pipe(
                switchMap((buffer) =>
                  from(pdfjs.getDocument({ data: buffer }).promise)
                )
              )
            )
          );
      } else {
        return;
      }

      loadPdf$
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (pdf) => {
            this.pdf = pdf;
            this.pageNumber.set(1);
            this.totalPages.set(pdf.numPages);
            console.log('Total pages:', this.totalPages());
            this.renderPage();
          },
          error: (error) => {
            console.error('Error loading PDF:', error);
          }
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

  private pageRangeValidator() {
    return () => {
      const form = this.rangeForm();
      if (!form) return null;
      
      const fromPage = form.get('fromPage')?.value ?? null;
      const toPage = form.get('toPage')?.value ?? null;

      if (!fromPage || !toPage) return null;

      if (fromPage > toPage) return { rangeOrder: true };

      if (this.totalPages() > 0 && (fromPage > this.totalPages() || toPage > this.totalPages())) {
        return { rangeBounds: true };
      }

      return null;
    };
  }

  get canUpload(): boolean {
    const pdfLoaded = !!this.pdf && this.totalPages() > 0;
    return pdfLoaded && this.rangeForm().valid;
  }

  get fromPageRequired(): boolean {
    return this.rangeForm()?.get('fromPage')?.hasError('required') ?? false;
  }

  get toPageRequired(): boolean {
    return this.rangeForm()?.get('toPage')?.hasError('required') ?? false;
  }

  get fromPageMin(): boolean {
    return this.rangeForm()?.get('fromPage')?.hasError('min') ?? false;
  }

  get toPageMin(): boolean {
    return this.rangeForm()?.get('toPage')?.hasError('min') ?? false;
  }

  get rangeOrderError(): boolean {
    return this.rangeForm()?.hasError('rangeOrder') ?? false;
  }

  get rangeBoundsError(): boolean {
    return this.rangeForm()?.hasError('rangeBounds') ?? false;
  }

  get formTouched(): boolean {
    return this.rangeForm()?.touched ?? false;
  }

  get formInvalid(): boolean {
    return this.rangeForm()?.invalid ?? false;
  }

  onSubmit() {
    if (!this.canUpload) return;

    const fromPage = this.rangeForm().value.fromPage!;
    const toPage = this.rangeForm().value.toPage!;
    const currentPdfId = this.pdfId();

    if (!currentPdfId) {
      console.error('No PDF ID available for submission');
      return;
    }

    this.pageRangeSubmitted.emit({
      pdf_id: currentPdfId,
      from_page: fromPage,
      to_page: toPage
    });
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
