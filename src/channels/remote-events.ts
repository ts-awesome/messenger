import {IChannel, MessageListener, Unsubscriber} from "../interfaces";
import {getData, uid} from "../utils";

const UID = Symbol('UID');

export class RemoteEvents implements IChannel {
  constructor(private source: EventSource) {
    this.source[UID] = this.source[UID] || uid()
  }

  postMessage(message: any): void {
    console.warn(`Sending data is not supported by EventSource`);
  }

  on<T = any>(type: 'message', listener: MessageListener<T>): Unsubscriber {
    const handler = (event: MessageEvent) => listener(getData(event), this.source[UID]);

    this.source.addEventListener('message', handler);

    return () => this.source.removeEventListener('message', handler);
  }
}
