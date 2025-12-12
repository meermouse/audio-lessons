import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { defer, Observable, of, shareReplay, from } from 'rxjs';

export type PdfjsModule = typeof import('pdfjs-dist');

@Injectable({ providedIn: 'root' })
export class PdfjsService {
  private readonly pdfjs$: Observable<PdfjsModule | null>;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.pdfjs$ = defer(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return of(null);
      }

      return from(
        import('pdfjs-dist').then((pdfjs) => {
          pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
          ).toString();

          return pdfjs;
        })
      );
    }).pipe(shareReplay(1));
  }

  getPdfjs(): Observable<PdfjsModule | null> {
    return this.pdfjs$;
  }
}
