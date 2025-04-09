class UniqueOrderedSet {
    items = new Map();
    constructor() { }
    add(key, value) {
        this.items.set(key, value);
    }
    values() {
        return Array.from(this.items.values());
    }
    extend(entries) {
        for (const [key, value] of entries) {
            this.add(key, value);
        }
    }
    size() {
        return this.items.size;
    }
    sort(compareFn) {
        const sortedValues = this.values();
        sortedValues.sort(compareFn);
        return sortedValues;
    }
}
export { UniqueOrderedSet };
