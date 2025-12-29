import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, interval, timer } from 'rxjs';
import { catchError, retry, retryWhen, mergeMap, finalize, take } from 'rxjs/operators';

/**
 * API Response interfaces matching backend schemas
 */
export interface UploadPdfResponse {
  pdf_id: string;
  pdf_key: string;
}

export interface PdfInfoResponse {
  pdf_id: string;
  num_pages: number;
}

export interface PdfListItem {
  pdf_id: string;
  pdf_key: string;
}

export interface ListPdfsResponse {
  pdfs: PdfListItem[];
}

export interface CreateJobRequest {
  pdf_id: string;
  from_page: number;
  to_page: number;
}

export interface CreateJobResponse {
  job_id: string;
  status_url: string;
  download_url: string;
}

export interface JobStatusResponse {
  job_id: string;
  state: string;
  result: Record<string, unknown> | null;
  error: string | null;
}

/**
 * API Service for communicating with the audio-lessons backend
 *
 * Provides methods for:
 * - Uploading PDF files
 * - Retrieving PDF information
 * - Creating lesson generation jobs
 * - Polling job status
 * - Downloading generated lesson bundles
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apiBaseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  /**
   * Upload a PDF file to the backend
   * @param file - The PDF file to upload
   * @returns Observable with upload response containing pdf_id and pdf_key
   */
  uploadPdf(file: File): Observable<UploadPdfResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadPdfResponse>(
      `${this.apiBaseUrl}/pdfs`,
      formData
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get information about an uploaded PDF
   * @param pdfId - The ID of the uploaded PDF
   * @returns Observable with PDF info (number of pages, etc.)
   */
  getPdfInfo(pdfId: string): Observable<PdfInfoResponse> {
    return this.http.get<PdfInfoResponse>(
      `${this.apiBaseUrl}/pdfs/${pdfId}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * List all uploaded PDFs
   * @returns Observable with list of available PDFs
   */
  listPdfs(): Observable<ListPdfsResponse> {
    return this.http.get<ListPdfsResponse>(
      `${this.apiBaseUrl}/pdfs`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Create a lesson generation job
   * @param request - Job creation request with pdf_id and page range
   * @returns Observable with job ID and status/download URLs
   */
  createJob(request: CreateJobRequest): Observable<CreateJobResponse> {
    return this.http.post<CreateJobResponse>(
      `${this.apiBaseUrl}/jobs`,
      request
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get the status of a lesson generation job
   * @param jobId - The ID of the job to check
   * @returns Observable with current job status (PENDING, SUCCESS, FAILURE, etc.)
   */
  getJobStatus(jobId: string): Observable<JobStatusResponse> {
    return this.http.get<JobStatusResponse>(
      `${this.apiBaseUrl}/jobs/${jobId}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Poll job status until completion with configurable retry
   * @param jobId - The ID of the job to monitor
   * @param pollInterval - Time in ms between status checks (default: 2000ms)
   * @param maxAttempts - Maximum number of polls before giving up (default: 300 = 10 minutes)
   * @returns Observable that emits job status updates until job completes or max attempts reached
   */
  pollJobStatus(
    jobId: string,
    pollInterval: number = 2000,
    maxAttempts: number = 300
  ): Observable<JobStatusResponse> {
    return timer(0, pollInterval).pipe(
      take(maxAttempts),
      mergeMap(() => this.getJobStatus(jobId)),
      catchError(this.handleError)
    );
  }

  /**
   * Download the completed lesson bundle as a ZIP file
   * @param jobId - The ID of the completed job
   * @returns Observable with Blob data of the ZIP file
   */
  downloadBundle(jobId: string): Observable<Blob> {
    return this.http.get(
      `${this.apiBaseUrl}/jobs/${jobId}/download`,
      { responseType: 'blob' }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Download bundle and trigger browser download
   * @param jobId - The ID of the completed job
   * @param filename - Optional custom filename for the downloaded file
   */
  downloadBundleAsFile(jobId: string, filename?: string): Observable<void> {
    return new Observable((observer) => {
      this.downloadBundle(jobId).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename || `lesson-${jobId}.zip`;
          link.click();
          window.URL.revokeObjectURL(url);
          observer.next();
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Handle HTTP errors and provide meaningful error messages
   * @param error - The HttpErrorResponse
   * @returns Observable error with formatted message
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (error.status === 404) {
        errorMessage = 'Resource not found (404)';
      } else if (error.status === 400) {
        errorMessage = error.error?.detail || 'Bad request (400)';
      } else if (error.status === 409) {
        errorMessage = error.error?.detail || 'Conflict (409)';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = `Server returned status ${error.status}`;
      }
    }

    console.error(errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
