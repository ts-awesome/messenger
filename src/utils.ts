import {Message} from './interfaces';

/** @private */
export function hasTopic(topic: string, topicOrNamespaces: (RegExp|string)[]) {
  return Array.isArray(topicOrNamespaces) && topicOrNamespaces
    .some(t => t instanceof RegExp ? t.test(topic) : topic.startsWith(t + '::'));
}

/** @private */
export function getData(msg: MessageEvent): Message {
  return typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36);​
}
