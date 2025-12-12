import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();