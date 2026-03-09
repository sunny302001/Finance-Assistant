import { IParserStrategy } from './types';
import { ChaseStrategy } from './ChaseStrategy';
import { GenericStrategy } from './GenericStrategy';

export class ParserFactory {
  private static strategies: IParserStrategy[] = [
    new ChaseStrategy(),
    // Add more strategies here (e.g., HDFCStrategy)
  ];

  static getStrategy(text: string): IParserStrategy {
    const matchingStrategy = this.strategies.find(s => s.canParse(text));
    return matchingStrategy || new GenericStrategy();
  }
}
