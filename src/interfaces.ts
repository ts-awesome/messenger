
export declare const enum Kind {
  Request = 'Request',
  Response = 'Response',
  Publish = 'Publish',
}
​
export type PublishMessage<T = any> = {
  kind: Kind.Publish;
  topic: string;
  data?: T;
}

export type RequestMessage<T = any> = {
  kind: Kind.Request;
  topic: string;
  id: string;
  data?: T;
}

export type ResponseMessage<T = any> = {
  kind: Kind.Response;
  topic: string;
  id: string;
  data?: T;
  error?: string | {message: string};
}

export type Message<T = any> = PublishMessage<T> | RequestMessage<T> | ResponseMessage<T>;

export interface IChannel {
  postMessage<T>(message: Message): void;
  addEventListener(type: 'message', listener: EventListener): void;
  removeEventListener(type: 'message', listener: EventListener): void;
}
​
export type Unsubscriber = () => void;

export interface IMessenger {
  query<T>(topic: string, data?: any, id?: string): Promise<T>;
  serve<T, X = any>(topic: string, handler: (x?: T) => X | Promise<X>): Unsubscriber;

  publish<T>(topic: string, data?: any): void;
  subscribe<T>(topic: string, handler: (data?: T) => void): Unsubscriber;
}

export interface IRouter {
  add(channel: IChannel, topics: RegExp[]): void;
}
