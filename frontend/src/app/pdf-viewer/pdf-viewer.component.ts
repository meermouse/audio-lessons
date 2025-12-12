import { Component, ElementRef, ViewChild, input, OnDestroy, effect, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { from, Subject, switchMap, takeUntil, filter } from 'rxjs';
import { PdfjsService } from '../services/pdfjs.service';
import { PDFDocumentProxy } from 'pdfjs-dist';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
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
  rangeForm = signal<any>(null);

  constructor(
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
  };

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

      // If PDF not loaded yet, don't block typing—submit button handles that.
      if (!fromPage || !toPage) return null;

      if (fromPage > toPage) return { rangeOrder: true };

      // If we know totalPages, enforce upper bound
      if (this.totalPages() > 0 && (fromPage > this.totalPages() || toPage > this.totalPages())) {
        return { rangeBounds: true };
      }

      return null;
    };
  }

  get canSubmit(): boolean {
    const pdfLoaded = !!this.pdf && this.totalPages() > 0;
    return pdfLoaded && this.rangeForm().valid;
  }
  
  onSubmit() {
    if (!this.canSubmit) return;

    const fromPage = this.rangeForm().value.fromPage!;
    const toPage = this.rangeForm().value.toPage!;

    // For now, just log. Next step will be: emit event / call backend job.
    console.log('Submit page range:', { fromPage, toPage });
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
