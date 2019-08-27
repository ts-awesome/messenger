import {
  IChannel,
  IMessenger,
  Kind,
  Message,
  MessageListener,
  RequestMessage,
  ResponseMessage,
  Unsubscriber
} from './interfaces';
import {uid} from './utils';

​
export class Messenger implements IMessenger {
​
  constructor(
    private readonly channel: IChannel,
  ) {}
​
  public query<T, X = any>(topic: string, data?: X, id: string = uid()): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.channel.postMessage({ kind: Kind.Request, topic, data, id});

      const unsubscribe = this.channel.on('message', ({kind, topic, ...msg}: ResponseMessage) => {
        if (kind !== Kind.Response || topic !== topic) {
          return
        }

        const {error, data, id: rid} = msg;

        if (rid !== id) {
          return;
        }

        error ? reject(error) : resolve(data);

        unsubscribe();
      });
    });
  }

  public publish<T>(topic: string, data?: any): void {
    this.channel.postMessage({ kind: Kind.Publish, topic, data});
  }
​
  public subscribe<T>(target: RegExp, handler: (topic: string, data?: T) => void): () => void {
    return this.handle<T>(
      ({kind, topic}) => kind === Kind.Listen && target.test(topic),
      ({topic, data}) => handler(topic, data));
  }
​
  public serve<T, X = any>(target: RegExp, handler: (topic: string, x?: T) => Promise<X>): () => void {
  ​ return this.handle<T>(
      ({kind, topic}) => kind === Kind.Request && target.test(topic),
    async ({data, topic, id}: RequestMessage<T>, sender: string) => {
      const response: ResponseMessage = {
        kind: Kind.Response,
        topic,
        id
      };
      try {
        response.data = await handler(topic, data);
      } catch (ex) {
        response.error = { message: ex.message || ex };
      } finally {
        this.channel.postMessage(response, sender);
      }
    });
  }

  private handle<T>(filter: (x: Message<T>) => boolean, handler: MessageListener<T>): Unsubscriber {
    return this.channel.on(
      'message',
      (data: Message<T>, sender: string) => filter(data) && handler(data, sender));
  }
}
