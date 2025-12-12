import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class PdfjsService {
  private pdfjsPromise: Promise<any> | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  async getPdfjs() {
    if (!isPlatformBrowser(this.platformId)) {
      // Prevent Node/SSR evaluation from ever importing pdfjs-dist
      return null;
    }

    if (!this.pdfjsPromise) {
      this.pdfjsPromise = (async () => {
        const pdfjs = await import('pdfjs-dist');

        // Configure worker (no ?url needed)
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();

        return pdfjs;
      })();
    }

    return this.pdfjsPromise;
  }
}
