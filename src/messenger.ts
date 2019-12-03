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
  protected readonly ns: string;

  constructor(
    private readonly channel: IChannel,
    namespace: string = '',
  ) {
    this.ns = namespace ? `${namespace}::` : '';
  }
​
  public query<T, X = any>(topic: string, data?: X, id: string = uid()): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.channel.postMessage({ kind: Kind.Request, topic: this.ns + topic, data, id});

      const unsubscribe = this.channel.on('message', ({kind, topic: reply, ...msg}: ResponseMessage) => {
        if (kind !== Kind.Response || (this.ns + topic) !== reply) {
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
    this.channel.postMessage({ kind: Kind.Publish, topic: this.ns + topic, data});
  }
​
  public subscribe<T>(target: RegExp, handler: (topic: string, data?: T) => void): () => void {
    return this.handle<T>(
      ({kind, topic}) => kind === Kind.Listen && (!this.ns || topic.startsWith(this.ns)) && target.test(topic.substr(this.ns.length)),
      ({topic, data}) => handler(topic.substr(this.ns.length), data));
  }
​
  public serve<T, X = any>(target: RegExp, handler: (topic: string, x?: T) => Promise<X>): () => void {
  ​ return this.handle<T>(
      ({kind, topic}) => kind === Kind.Request && (!this.ns || topic.startsWith(this.ns)) && target.test(topic.substr(this.ns.length)),
    async ({data, topic, id}: RequestMessage<T>, sender: string) => {
      const response: ResponseMessage = {
        kind: Kind.Response,
        topic,
        id
      };
      try {
        response.data = await handler(topic.substr(this.ns.length), data);
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
