import {IChannel} from './interfaces';

export class RemoteOrigin implements IChannel {
  private handlers = new Map<any, any>();

  constructor(private origin: string, private window: Window) {}

  postMessage(message: any): void {
    this.window.postMessage(message, this.origin);
  }

  addEventListener(type: 'message', listener: EventListener): void {
    if (!this.handlers.has(listener)) {
      this.handlers.set(listener, (event: MessageEvent) => {
        if (event.origin === this.origin) {
          listener(event);
        }
      })
    }
    this.window.addEventListener('message', this.handlers.get(listener));
  }

  removeEventListener(type: 'message', listener: EventListener): void {
    if (this.handlers.has(listener)) {
      this.window.removeEventListener('message', this.handlers.get(listener));
    }
  }
}

export class RemoteSocket implements IChannel {
  constructor(private socket: WebSocket) {}

  postMessage(message: any): void {
    this.socket.send(message);
  }

  addEventListener(type: 'message', listener: EventListener): void {
    this.socket.addEventListener('message', listener);
  }

  removeEventListener(type: "message", listener: EventListener): void {
    this.socket.removeEventListener('message', listener);
  }
}
