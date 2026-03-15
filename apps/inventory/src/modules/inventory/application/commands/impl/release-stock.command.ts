export class ReleaseStockCommand {
  constructor(
    public readonly userId: number,
    public readonly item: { sku: string; productId: string; quantity: number },
  ) {}
}
