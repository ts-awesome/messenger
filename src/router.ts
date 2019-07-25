import {IChannel, IRouter, Kind, Message, RequestMessage, ResponseMessage} from './interfaces';
import {hasTopic, getData} from './utils';

​
export class Router implements IRouter {

  private channels = new Map<IChannel, RegExp[]>();
  private requests = new Map<string, IChannel>();
​
  public add(channel: IChannel, topics: RegExp[]): void {
    this.channels.set(channel, topics);
​
    channel.addEventListener(
      'message',
      (msg: MessageEvent) => this.dispatch(getData(msg), channel));
  }
​
  private dispatch = (data: Message, origin: IChannel) => {
    this.channels.forEach((topics, w) => {
      const {kind, topic} = data;
      switch (kind) {
        case Kind.Publish:
          if (hasTopic(topic, topics)) {
            w.postMessage(data);
          }
          break;
        case Kind.Request:
          if (hasTopic(topic, topics)) {
            this.requests.set((<RequestMessage>data).id, origin);
            w.postMessage(data);
          }
          break;
        case Kind.Response:
          const {id} = data as ResponseMessage;
          if (this.requests.has(id) && this.requests.get(id) === w) {
            this.requests.delete(id);
            w.postMessage(data);
          }
          break;
      }
    });
  };
}
