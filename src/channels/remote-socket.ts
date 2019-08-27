import {IChannel, Message, MessageListener, Unsubscriber} from "../interfaces";
import {getData, uid} from "../utils";

const UID = Symbol('UID');

export class RemoteSocket implements IChannel {
  private handlers = new WeakMap<MessageListener, EventListener>();
  private me = uid();

  constructor(private socket: WebSocket) {
    this.socket[UID] = this.socket[UID] || uid();
  }

  postMessage(message: Message): void {
    this.socket.send(JSON.stringify({...message, origin: this.me}));
  }

  on<T = any>(type: 'message', listener: MessageListener<T>): Unsubscriber {
    const handler = (event: MessageEvent) => listener(getData(event), this.socket[UID]);

    this.socket.addEventListener('message', handler);

    return () => this.socket.removeEventListener('message', handler);
  }
}
