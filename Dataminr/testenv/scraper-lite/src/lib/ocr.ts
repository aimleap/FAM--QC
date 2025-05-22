import { createWorker } from 'tesseract.js';
import request from 'request-promise';
import pdf from 'pdf-parse';

/**
 * OCR util to extract text from images such bmp, jpg, png, pbm, webp
 * support the following languages https://tesseract-ocr.github.io/tessdoc/Data-Files#data-files-for-version-400-november-29-2016
 * @param imageLink image link
 * @param lang support lang
 */
export async function extractTextFromImage(
  imageLink: string,
  lang: string = 'eng',
): Promise<string> {
  const worker = await createWorker(lang);
  const {
    data: { text },
  } = await worker.recognize(imageLink);
  return text;
}

/**
 * extract text from pdf link
 * @param pdfLink pdf link
 */
export async function extractTextFromPdf(pdfLink: string): Promise<pdf.Result> {
  const response = await request({
    method: 'get',
    strictSSL: false,
    url: pdfLink,
  });

  return pdf(Buffer.from(response));
}
