import { IParserStrategy, RawTransaction } from './types';

export class ChaseStrategy implements IParserStrategy {
  name = 'Chase';

  canParse(text: string): boolean {
    return text.toLowerCase().includes('chase') && text.toLowerCase().includes('statement');
  }

  parse(text: string): RawTransaction[] {
    // 100% offline regex parsing logic
    const transactions: RawTransaction[] = [];
    
    // Example regex for Chase transaction lines: MM/DD description amount
    // Note: This is a simplified heuristic for demonstration
    const regex = /(\d{2}\/\d{2})\s+([A-Z\s]+?)\s+(-?\$?\d+,?\d*\.\d{2})/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const [_, dateStr, desc, amountStr] = match;
      
      // Convert MM/DD to current year date
      const currentYear = new Date().getFullYear();
      const date = new Date(`${dateStr}/${currentYear}`).getTime();
      
      const amount = parseFloat(amountStr.replace(/[$,]/g, ''));

      transactions.push({
        date,
        description: desc.trim(),
        amount,
        rawText: match[0],
      });
    }

    return transactions;
  }
}
