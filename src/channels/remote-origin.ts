import {IChannel, Message, MessageListener, Unsubscriber} from "../interfaces";
import {getData} from "../utils";

interface Window {
  readonly location: Location;
  postMessage(message: any, targetOrigin: string): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export class RemoteOrigin implements IChannel {
  constructor(
    private window: Window,
    private targetOrigin: string,
  ) {}

  postMessage(message: Message): void {
    this.window.postMessage({
      ...message,
      origin: this.window.location.origin,
    }, this.targetOrigin);
  }

  on<T = any>(type: 'message', listener: MessageListener<T>): Unsubscriber {
    const handler = (event: MessageEvent) => {
      if (event.origin === this.targetOrigin) {
        listener(getData(event), event.origin);
      }
    };

    this.window.addEventListener('message', handler);

    return () => this.window.removeEventListener('message', handler);
  }
}
