import * as DocumentPicker from 'expo-document-picker';
import { database } from '../database';
import { ImportLog, Transaction, Category } from '../database/models';
import MlkitOcr from 'react-native-mlkit-ocr';
import { ParserFactory } from './parsers/ParserFactory';
import { CategorizerService } from './CategorizerService';
import { SubscriptionService } from './SubscriptionService';

export class IngestionService {
  /**
   * The "Waterfall" Pipeline:
   * 1. Acquisition -> 2. Extraction -> 3. Standardization -> 4. Categorization
   */
  static async processDocument(uri: string, filename: string): Promise<void> {
    // 0. Duplicate Check
    const existing = await database.get<ImportLog>('import_logs')
      .query()
      .fetch();
    if (existing.some(log => log.filename === filename && log.status === 'success')) {
      throw new Error('File already processed');
    }

    const log = await database.write(async () => {
      return await database.get<ImportLog>('import_logs').create(record => {
        record.filename = filename;
        record.status = 'pending';
        record.transactionCount = 0;
      });
    });

    try {
      // 1. Extraction (ML Kit OCR)
      const result = await MlkitOcr.detectFromUri(uri);
      const fullText = result.map(block => block.text).join('\n');

      if (!fullText.trim()) {
        throw new Error('No text extracted from document');
      }

      // 2. Standardization (Strategy Pattern)
      const strategy = ParserFactory.getStrategy(fullText);
      const rawTransactions = strategy.parse(fullText);

      // 3. Categorization & Persistence
      await database.write(async () => {
        for (const raw of rawTransactions) {
          const categoryName = await CategorizerService.getCategoryForDescription(raw.description);
          
          // Find or create category
          const categories = await database.get<Category>('categories')
            .query()
            .fetch();
          let category = categories.find(c => c.name === categoryName);
          
          if (!category) {
            category = await database.get<Category>('categories').create(c => {
              c.name = categoryName;
              c.type = 'want'; // Default
            });
          }

          await database.get<Transaction>('transactions').create(tx => {
            tx.amount = raw.amount;
            tx.date = raw.date;
            tx.description = raw.description;
            tx.rawText = raw.rawText;
            tx.categoryId = category?.id;
            tx.isSubscription = false; // Heuristic could be added here
          });
        }

        // 4. Run Subscription Detection
        await SubscriptionService.detectSubscriptions();

        // 5. Finalize Log
        await log.update(l => {
          l.status = 'success';
          l.transactionCount = rawTransactions.length;
        });
      });

    } catch (error: any) {
      await database.write(async () => {
        await log.update(l => {
          l.status = 'error';
          l.errorMessage = error.message;
        });
      });
      throw error;
    }
  }

  static async pickAndProcess(): Promise<void> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'text/csv', 'image/*'],
      copyToCacheDirectory: true
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    await this.processDocument(asset.uri, asset.name);
  }
}
