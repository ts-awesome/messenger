/** @private */
export function hasTopic(topic: string, topics: RegExp[]) {
  return Array.isArray(topics) && topics.some(t => t.test(topic));
}

/** @private */
export function getData(msg: MessageEvent): any {
  return typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
}
