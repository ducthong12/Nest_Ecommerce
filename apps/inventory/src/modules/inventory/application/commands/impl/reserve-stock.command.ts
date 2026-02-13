export class ReserveStockCommand {
  constructor(
    public readonly userId: number,
    public readonly items: any[],
  ) {}
}
