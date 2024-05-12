export class List<Key, Value> {
  maxSize: number;

  #head: ListNode<Key, Value> | undefined;
  #tail: ListNode<Key, Value> | undefined;

  #size = 0;
  #map = new Map<Key, ListNode<Key, Value>>();

  constructor(maxSize: number) {
    if (maxSize < 2) {
      throw new Error('maxSize must be at least 2');
    }
    this.maxSize = maxSize;
  }

  get size() {
    return this.#size;
  }

  get head() {
    return this.#head;
  }

  get tail() {
    return this.#tail;
  }

  get isEmpty() {
    return this.#size === 0;
  }

  get isFull() {
    return this.#size === this.maxSize;
  }

  addAfterNode(
    prevNode: ListNode<Key, Value> | undefined,
    node: ListNode<Key, Value>,
  ) {
    // Add to the tail
    if (this.#map.has(node.key)) {
      throw new Error('node already exists');
    }

    if (!prevNode) {
      return this.append(node);
    }

    if (!this.#map.has(prevNode.key)) {
      throw new Error('prevNode does not exist');
    }

    if (!this.isFull && prevNode === this.tail) {
      return this.#appendHasSpaceNotEmpty(node);
    }

    const nextNode = prevNode.next;

    if (this.isFull) {
      const removedHead = this.#removeFromHead();

      if (prevNode === removedHead) {
        prevNode = undefined;
      }
    }

    // Append in the middle
    if (prevNode) {
      prevNode.next = node;
    }
    node.prev = prevNode;
    node.next = nextNode;

    if (nextNode) {
      nextNode.prev = node;
    }

    node.list = this;
    this.#size++;
    this.#map.set(node.key, node);
  }

  getNodeFromKey(key: Key) {
    return this.#map.get(key);
  }

  append(node: ListNode<Key, Value>) {
    if (this.isEmpty) {
      this.#head = this.#tail = node;
      node.list = this;
      this.#size++;
      this.#map.set(node.key, node);

      return;
    }

    if (!this.isFull) {
      this.#appendHasSpaceNotEmpty(node);

      return;
    }

    // Remove the head
    this.#removeFromHead();

    // Add the new node to the tail
    this.#appendHasSpaceNotEmpty(node);
  }

  #appendHasSpaceNotEmpty(node: ListNode<Key, Value>) {
    if (this.isFull) {
      throw new Error('list is full');
    }

    if (this.isEmpty) {
      throw new Error('list is empty');
    }

    this.#tail.next = node;
    node.prev = this.tail;
    this.#tail = node;
    node.list = this;
    this.#size++;
    this.#map.set(node.key, node);
  }

  #removeFromHead() {
    const headToRemove = this.#head;
    this.#map.delete(headToRemove.key);
    this.#head = headToRemove.next;
    this.#head.prev = undefined;
    this.#size--;

    return headToRemove;
  }
}

export class ListNode<Key, Value> {
  list: List<Key, Value>;
  next: ListNode<Key, Value> | undefined;
  prev: ListNode<Key, Value> | undefined;
  key: Key;
  value: Value;

  constructor(key: Key, value: Value) {
    this.key = key;
    this.value = value;
  }
}
