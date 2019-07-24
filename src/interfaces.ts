
export declare const enum Kind {
  Request = 'Request',
  Response = 'Response',
  Publish = 'Publish',
}
​
export interface IChannel {
  postMessage(message: any): void;
  addEventListener(type: 'message', listener: EventListener): void;
  removeEventListener(type: 'message', listener: EventListener): void;
}
​
export type Unsubscriber = () => void;

export interface IMessenger {
  query<T>(topic: string, data?: any, id?: string): Promise<T>;
  serve<T, X = any>(topic: string, handler: (x: T) => X | Promise<X>): Unsubscriber;

  publish<T>(topic: string, data?: any): void;
  subscribe<T>(topic: string, handler: (data: T) => void): Unsubscriber;
}

export interface IRouter {
  add(channel: IChannel, topics: RegExp[]): void;
}
