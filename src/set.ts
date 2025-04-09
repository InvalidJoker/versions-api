class UniqueOrderedSet<T> {
  private items = new Map<string, T>();

  constructor() {}

  add(key: string, value: T): void {
    this.items.set(key, value);
  }

  values(): T[] {
    return Array.from(this.items.values());
  }

  extend(entries: [string, T][]): void {
    for (const [key, value] of entries) {
      this.add(key, value);
    }
  }

  size(): number {
    return this.items.size;
  }

  sort(compareFn: (a: T, b: T) => number): T[] {
    const sortedValues = this.values();
    sortedValues.sort(compareFn);
    return sortedValues;
  }
}

export { UniqueOrderedSet };
