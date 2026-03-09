export interface RawTransaction {
  date: number; // epoch
  description: string;
  amount: number;
  rawText?: string;
}

export interface IParserStrategy {
  name: string;
  canParse(text: string): boolean;
  parse(text: string): RawTransaction[];
}
