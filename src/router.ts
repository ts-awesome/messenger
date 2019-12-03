import {IChannel, IRouter, Kind, Message, RequestMessage, ResponseMessage, Unsubscriber} from './interfaces';
import {hasTopic} from './utils';

​
export class Router implements IRouter {
  private channels = new Map<IChannel, (RegExp|string)[]>();
  private subscriptions = new WeakMap<IChannel, Unsubscriber>();
  private requests = new Map<string, IChannel>();
​
  public add(channel: IChannel, topicOrNamespaces: (RegExp|string)[]): void {
    this.remove(channel);

    this.channels.set(channel, topicOrNamespaces);
​
    const unsub = channel.on(
      'message',
      (msg: Message) => this.dispatch(msg, channel));

    this.subscriptions.set(channel, unsub);
  }

  public remove(channel: IChannel): void {
    if (this.subscriptions.has(channel)) {
      this.subscriptions.get(channel)!();
      this.subscriptions.delete(channel);
    }
    if (this.channels.has(channel)) {
      this.channels.delete(channel);
    }
  }
​
  private dispatch = (data: Message, origin: IChannel) => {
    const {kind, topic} = data;
    if (kind === Kind.Response) {
      const {id} = data as ResponseMessage;
      if (this.requests.has(id)) {
        const w = this.requests.get(id)!;
        this.requests.delete(id);
        w.postMessage(data);
      }
      return;
    }

    if (kind === Kind.Request) {
      this.requests.set((<RequestMessage>data).id, origin);
    }

    this.channels.forEach((topics, w) => {
      switch (kind) {
        case Kind.Listen:
        case Kind.Publish:
        case Kind.Request:
          if (hasTopic(topic, topics) && w !== origin) {
            w.postMessage(data);
          }
          break;
      }
    });
  };
}
