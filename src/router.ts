import {IChannel, IRouter, Kind} from './interfaces';
import {hasTopic, getData} from './utils';

​
export class Router implements IRouter {

  private channels = new Map<IChannel, RegExp[]>();
  private requests = new Map<number, IChannel>();
​
  public add(channel: IChannel, topics: RegExp[]): void {
    this.channels.set(channel, topics);
​
    channel.addEventListener(
      'message',
      (msg: MessageEvent) => this.dispatch(getData(msg), channel));
  }
​
  private dispatch = (data: any, origin: IChannel) => {
    const {kind, topic, id} = data;
    this.channels.forEach((topics, w) => {
      switch (kind) {
        case Kind.Publish:
          if (hasTopic(topic, topics)) {
            w.postMessage(data);
          }
          return;
        case Kind.Request:
          if (hasTopic(topic, topics)) {
            this.requests.set(id, origin);
            w.postMessage(data);
          }
          return;
        case Kind.Response:
          if (this.requests.has(id) && this.requests.get(id) === w) {
            this.requests.delete(id);
            w.postMessage(data);
          }
          return;
      }
    });
  };
}
