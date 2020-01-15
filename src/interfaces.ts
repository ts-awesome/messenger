
export declare const enum Kind {
  Request = 'request',
  Response = 'response',
  Publish = 'publish',
  Listen = 'listen',
}
​
export interface PublishMessage<T = any> {
  kind: Kind.Publish;
  topic: string;
  data?: T;
}
​
export interface ListenMessage<T = any> {
  kind: Kind.Listen;
  topic: string;
  data?: T;
}

export interface RequestMessage<T = any> {
  kind: Kind.Request;
  topic: string;
  id: string;
  data?: T;
}

export interface ResponseMessage<T = any> {
  kind: Kind.Response;
  topic: string;
  id: string;
  data?: T;
  error?: string | {message: string, [key: string]: any};
}

export type Message<T = any> = PublishMessage<T> | ListenMessage<T> | RequestMessage<T> | ResponseMessage<T>;

export type SenderId = string;

export interface MessageListener<T = any> {
  (data: Message<T>, sender: SenderId): void;
}

export interface Unsubscriber {
  (): void;
}

export interface IChannel {
  postMessage<T = any>(message: Message<T>, recipient?: string): void;
  on<T=any>(kind: 'message', listener: MessageListener<T>): Unsubscriber;
}
​
export interface IMessenger {
  query<T>(topic: string, data?: any, id?: string): Promise<T>;
  serve<T, X = any>(topic: RegExp, handler: (topic: string, x?: T) => X | Promise<X>): Unsubscriber;

  publish<T>(topic: string, data?: any): void;
  notify<T>(recipient: SenderId, topic: string, data?: any): void;
  subscribe<T>(topic: RegExp, handler: (topic: string, data?: T) => void): Unsubscriber;
}

export interface IRouter {
  add(channel: IChannel, topics: RegExp[]): void;
  remove(channel: IChannel): void;
}
