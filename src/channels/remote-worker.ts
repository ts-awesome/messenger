import {IChannel, Message, MessageListener, Unsubscriber} from "../interfaces";
import {getData, uid} from "../utils";

const UID = Symbol('UID');

export class RemoteWorker implements IChannel {
  private handlers = new WeakMap<MessageListener, EventListener>();
  private me = uid();

  constructor(private worker: Worker) {
    this.worker[UID] = this.worker[UID] || uid();
  }

  postMessage<T = any>(message: Message<T>): void {
    this.worker.postMessage(JSON.stringify({...message, origin: this.me}));
  }

  on<T = any>(type: 'message', listener: MessageListener<T>): Unsubscriber {
    const handler = (event: MessageEvent) => listener(getData(event), this.worker[UID]);

    this.worker.addEventListener('message', handler);

    return () => this.worker.removeEventListener('message', handler);
  }
}
