import {IChannel, IMessenger, Kind, Message, RequestMessage} from './interfaces';
import {getData, uid} from './utils';

​
export class Messenger implements IMessenger {
​
  constructor(
    private readonly channel: IChannel
  ) {}
​
  public query<T, X = any>(topic: string, data?: X, id: string = uid()): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.channel.postMessage({ kind: Kind.Request, topic, data, id});

      const handler = (event: MessageEvent) => {
        const msg = getData(event);
        if (msg.kind !== Kind.Response || msg.topic !== topic || msg.id !== id) {
          return
        }
​
        this.channel.removeEventListener('message', handler);
​
        const {error, data} = msg;
        error ? reject(error) : resolve(data);
      };

      this.channel.addEventListener('message', handler);
    });
  }

  public publish<T>(topic: string, data?: any): void {
    this.channel.postMessage({ kind: Kind.Publish, topic, data});
  }
​
  public subscribe<T>(target: string, handler: (data?: T) => void): () => void {
    return this.handle<T>(
      ({kind, topic}) => kind === Kind.Request && topic === target,
      ({data}) => handler(data));
  }
​
  public serve<T, X = any>(target: string, handler: (x?: T) => Promise<X>): () => void {
  ​ return this.handle<T>(
      ({kind, topic}) => kind === Kind.Request && topic === target,
    async ({data, topic, id}: RequestMessage<T>) => {
      try {
        this.channel.postMessage({ kind: Kind.Response, topic, id, data: await handler(data) });
      } catch (ex) {
        this.channel.postMessage({ kind: Kind.Response, topic, id, error: { message: ex.message || ex } });
      }
    });
  }

  private handle<T>(
    filter: (x: Message<T>) => boolean,
    handler: (x: Message<T>) => void,
  ) {
    const wrapper = (msg: MessageEvent) => {
      const data = getData(msg);
      if (filter(data)) {
        handler(data);
      }
    };
    this.channel.addEventListener('message', wrapper);
    return () => this.channel.removeEventListener('message', wrapper);
  }
}
