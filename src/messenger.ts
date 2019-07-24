import {IChannel, IMessenger, Kind} from './interfaces';
import {getData} from './utils';

​
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36);​
}

export class Messenger implements IMessenger {
​
  constructor(
    private readonly channel: IChannel
  ) {}
​
  public query<T>(topic: string, data?: any, id: string = uid()): Promise<T> {
    return new Promise((resolve, reject) => {
      this.channel.postMessage({ kind: Kind.Request, topic, data, id});

      const handler = (msg: MessageEvent) => {
        const {kind, topic, id: _, data, error} = getData(msg);
        if (kind !== Kind.Response || topic !== topic || _ !== id) {
          return
        }
​
        this.channel.removeEventListener('message', handler);
​
        error ? reject(error) : resolve(data);
      };

      this.channel.addEventListener('message', handler);
    });
  }

  public publish<T>(topic: string, data?: any): void {
    this.channel.postMessage({ kind: Kind.Publish, topic, data});
  }
​
  public subscribe<T>(target: string, handler: (data: T) => void): () => void {
    return this.handle(
      ({kind, topic}) => kind === Kind.Request && topic === target,
      handler);
  }
​
  public serve<T>(target: string, handler: (x: T) => Promise<any>): () => void {
  ​ return this.handle(
      ({kind, topic}) => kind === Kind.Request && topic === target,
    async ({data, topic, id}) => {
      let res = null;
      try {
        res = { kind: Kind.Response, topic, id, data: await handler(data) };
      } catch (ex) {
        res = { kind: Kind.Response, topic, id, error: { message: ex.message || ex } };
      }
      this.channel.postMessage(res);
    });
  }

  private handle(
    filter: (x: any) => boolean,
    handler: (x: any) => void,
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
