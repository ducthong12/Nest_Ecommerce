export class CheckoutOrderCommand {
  constructor(
    public readonly userId: number,
    public readonly items: any[],
  ) {}
}
