export class RoomQueue {
  private readonly tails = new Map<string, Promise<void>>();

  public async run<TResult>(
    roomId: string,
    task: () => Promise<TResult>,
  ): Promise<TResult> {
    const previous = this.tails.get(roomId) ?? Promise.resolve();
    let release: (() => void) | undefined;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const tail = previous.catch(() => undefined).then(() => current);
    this.tails.set(roomId, tail);

    await previous.catch(() => undefined);

    try {
      return await task();
    } finally {
      release?.();
      if (this.tails.get(roomId) === tail) {
        this.tails.delete(roomId);
      }
    }
  }
}
