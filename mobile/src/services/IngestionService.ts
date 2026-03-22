import * as DocumentPicker from 'expo-document-picker';
import { database } from '../database';
import { Transaction } from '../database/models/Transaction';
import MlkitOcr from 'react-native-mlkit-ocr';
import { RawTransaction } from './parsers/types';

/**
 * IngestionService
 * Handles the complete on-device pipeline: OCR -> Regex Parsing -> WatermelonDB
 */
export class IngestionService {
  /**
   * Step 1: Extract Text using ML Kit OCR
   */
  static async extractText(uri: string): Promise<string> {
    console.log(`[Ingestion] Extracting text from: ${uri}`);
    try {
      const result = await MlkitOcr.detectFromUri(uri);
      const fullText = result.map(block => block.text).join('\n');
      console.log(`[Ingestion] OCR complete. Extracted ${fullText.length} characters.`);
      return fullText;
    } catch (error) {
      console.error('[Ingestion] OCR Extraction failed:', error);
      throw new Error('Failed to extract text from document. Ensure it is a valid PDF or Image.');
    }
  }

  /**
   * Step 2: Parse Raw Text into Structured Transactions
   * Uses a heuristic Regex approach as a fallback parser.
   */
  static parseTextToTransactions(rawText: string): RawTransaction[] {
    console.log('[Ingestion] Parsing text to transactions...');
    const transactions: RawTransaction[] = [];
    
    /**
     * Regex Heuristic:
     * 1. Date: DD/MM/YYYY or DD-MM-YYYY or DD/MM
     * 2. Description: Any text in between
     * 3. Amount: -?1,234.56 or -?123.45
     */
    const lineRegex = /^(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\s+(.+?)\s+(-?[\d,]+\.\d{2})\s*$/gm;
    
    let match;
    while ((match = lineRegex.exec(rawText)) !== null) {
      const [_, dateStr, description, amountStr] = match;
      
      // Clean amount: remove commas and parse
      const amount = parseFloat(amountStr.replace(/,/g, ''));
      
      if (!isNaN(amount)) {
        // Date parsing: simple heuristic for DD/MM/YYYY or DD/MM
        let timestamp = Date.now();
        try {
          const parts = dateStr.split(/[/-]/);
          if (parts.length === 2) {
            // Handle DD/MM by assuming current year
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // 0-indexed
            const year = new Date().getFullYear();
            timestamp = new Date(year, month, day).getTime();
          } else if (parts.length === 3) {
            // Handle DD/MM/YYYY or DD/MM/YY
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            let year = parseInt(parts[2]);
            if (year < 100) year += 2000;
            timestamp = new Date(year, month, day).getTime();
          }
        } catch (e) {
          console.warn(`[Ingestion] Failed to parse date string: ${dateStr}`);
        }

        transactions.push({
          date: isNaN(timestamp) ? Date.now() : timestamp,
          description: description.trim(),
          amount,
          rawText: match[0],
        });
      }
    }

    console.log(`[Ingestion] Parsing complete. Found ${transactions.length} transactions.`);
    return transactions;
  }

  /**
   * Step 3: Batch Save Transactions to WatermelonDB
   */
  static async saveToDatabase(transactions: RawTransaction[]): Promise<void> {
    console.log(`[Ingestion] Saving ${transactions.length} transactions to database...`);
    try {
      await database.write(async () => {
        const transactionsToCreate = transactions.map(raw => 
          database.get<Transaction>('transactions').prepareCreate(tx => {
            tx.amount = raw.amount;
            tx.date = raw.date;
            tx.description = raw.description;
            tx.rawText = raw.rawText;
            tx.isSubscription = false;
          })
        );
        await database.batch(...transactionsToCreate);
      });
      console.log('[Ingestion] Batch save successful.');
    } catch (error) {
      console.error('[Ingestion] Database save failed:', error);
      throw new Error('Failed to save transactions to database.');
    }
  }

  /**
   * Orchestrator: Pick a document and run the pipeline
   */
  static async pickAndProcess(onProgress?: (step: string) => void): Promise<number> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'text/csv'],
      copyToCacheDirectory: true
    });

    if (result.canceled) return 0;

    const asset = result.assets[0];
    
    onProgress?.("Scanning Document...");
    const text = await this.extractText(asset.uri);
    if (!text.trim()) throw new Error("The document appears to be empty or unreadable.");

    onProgress?.("Parsing Data...");
    const transactions = this.parseTextToTransactions(text);
    if (transactions.length === 0) {
      throw new Error("No transactions were found. Ensure the document is a supported bank statement.");
    }

    onProgress?.("Saving to Database...");
    await this.saveToDatabase(transactions);

    return transactions.length;
  }
}
