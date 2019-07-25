/** @private */
import {Message} from './interfaces';

export function hasTopic(topic: string, topics: RegExp[]) {
  return Array.isArray(topics) && topics.some(t => t.test(topic));
}

/** @private */
export function getData(msg: MessageEvent): Message {
  return typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36);​
}
