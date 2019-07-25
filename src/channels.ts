import {IChannel, Message} from './interfaces';

export class RemoteWorker extends Worker implements IChannel {

}

export class RemoteOrigin implements IChannel {
  private handlers = new Map<any, any>();

  constructor(private origin: string, private window: Window) {}

  postMessage(message: Message): void {
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

  postMessage(message: Message): void {
    this.socket.send(JSON.stringify(message));
  }

  addEventListener(type: 'message', listener: EventListener): void {
    this.socket.addEventListener('message', listener);
  }

  removeEventListener(type: "message", listener: EventListener): void {
    this.socket.removeEventListener('message', listener);
  }
}

export class RemoteEvents implements IChannel {
  constructor(private source: EventSource) {}

  postMessage(message: any): void {
    console.warn(`Sending data is not supported by EventSource`);
  }

  addEventListener(type: 'message', listener: EventListener): void {
    this.source.addEventListener('message', listener);
  }

  removeEventListener(type: "message", listener: EventListener): void {
    this.source.removeEventListener('message', listener);
  }
}
