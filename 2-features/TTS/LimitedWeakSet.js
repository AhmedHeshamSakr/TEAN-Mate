export default class LimitedWeakSet {
    constructor(limit) {
        this.limit = limit; // Maximum number of elements to retain
        this.items = new Set(); // Use a regular Set to manage items
    }

    add(item) {
        if (!(item instanceof Object)) {
            throw new Error("LimitedWeakSet can only contain objects.");
        }

        // If the Set exceeds the limit, remove the oldest entry
        if (this.items.size >= this.limit) {
            const oldest = this.items.values().next().value; // Get the first (oldest) item
            this.items.delete(oldest); // Remove it from the Set
        }

        this.items.add(item); // Add the new item
    }

    has(item) {
        return this.items.has(item); // Check if the item exists in the Set
    }

    delete(item) {
        return this.items.delete(item); // Remove the item from the Set
    }

    size() {
        return this.items.size; // Get the current size of the Set
    }
}
