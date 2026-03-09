import { IParserStrategy, RawTransaction } from './types';

export class GenericStrategy implements IParserStrategy {
  name = 'Generic';

  canParse(text: string): boolean {
    return true; // Fallback
  }

  parse(text: string): RawTransaction[] {
    const transactions: RawTransaction[] = [];
    
    // Generic heuristic: Look for anything that looks like a date followed by a description and a currency amount
    // Dates: 2023-11-01, 01/11/2023, Nov 1
    // Amount: $1,234.56 or -123.45
    const regex = /(\d{1,4}[-/.\s]\d{1,2}[-/.\s]\d{2,4}|\b[A-Z]{3}\s\d{1,2})\b[\s\S]*?(-?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
    
    // This is a complex catch-all, in a real app we'd spend more time refining these heuristics
    let match;
    while ((match = regex.exec(text)) !== null) {
      // Simplified: Just extract what we can find
      const dateStr = match[1];
      const amountStr = match[2];
      
      const amount = parseFloat(amountStr.replace(/[$,]/g, ''));
      if (isNaN(amount)) continue;

      transactions.push({
        date: new Date(dateStr).getTime() || Date.now(),
        description: "Unparsed Transaction",
        amount,
        rawText: match[0],
      });
    }

    return transactions;
  }
}
