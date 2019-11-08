import {IChannel, Kind, Message, MessageListener, Unsubscriber} from "../interfaces";
import {uid} from "../utils";

export interface IMqttConnector {
  on (event: 'message', cb: (topic: string, payload: string) => void): this
  publish (topic: string, message: string, opts: {qos: 0|1|2}): this
  subscribe (topic: string, opts: {qos: 0|1|2}): this
  unsubscribe (topic: string): this
}

export abstract class MqttBaseChannel implements IChannel {
  private handlers = new Set<MessageListener>();

  protected constructor(
    private connector: IMqttConnector,
    private sender: string,
    private recipient: string,
  ) {
    this.connector.on('message', this.handle);
  }

  public postMessage(message: Message, recipient?: string): void {
    const {kind, topic} = message;

    this.connector.publish(
      `${recipient || this.recipient}/${kind}/${topic}`,
      JSON.stringify({
        ...message,
        origin: this.sender,
      }),
      {
        qos: kind === Kind.Request || kind === Kind.Response
          ? 2 // should be delivered exactly once
          : 0 // fire & forget
      });
  }

  public on<T=any>(kind: 'message', listener: MessageListener<T>): Unsubscriber {
    this.handlers.add(listener);
    return () => this.handlers.delete(listener);
  }

  private handle = (topic: string, payload: string) => {
    const {origin, ...data} = JSON.parse(payload.toString());
    this.handlers.forEach(handler => handler(data, origin));
  };
}

export class MqttClient extends MqttBaseChannel {
  constructor(private mqtt: IMqttConnector, private target: string, private origin: string = uid()) {
    super(mqtt, origin, target);

    mqtt.subscribe(`${origin}/${Kind.Response}/#`, {qos: 2});
    mqtt.subscribe(`${origin}/${Kind.Listen}/#`, {qos: 0});
    mqtt.subscribe(`${target}/${Kind.Publish}/#`, {qos: 1});
  }

  public destroy() {
    this.mqtt.unsubscribe(`${this.origin}/${Kind.Response}/#`);
    this.mqtt.unsubscribe(`${this.origin}/${Kind.Listen}/#`);
    this.mqtt.unsubscribe(`${this.target}/${Kind.Publish}/#`);
  }
}

export class MqttServer extends MqttBaseChannel {

  constructor(private mqtt: IMqttConnector, private origin: string = uid()) {
    super(mqtt, origin, origin);

    mqtt.subscribe(`${origin}/${Kind.Request}/#`, {qos: 2});
    mqtt.subscribe(`${origin}/${Kind.Listen}/#`, {qos: 0});
  }

  public destroy() {
    this.mqtt.unsubscribe(`${origin}/${Kind.Request}/#`);
    this.mqtt.unsubscribe(`${origin}/${Kind.Listen}/#`);
  }
}

export class MqttServiceDiscovery extends MqttBaseChannel {
  constructor(private mqtt: IMqttConnector, private topic: string, private origin: string = uid()) {
    super(mqtt, origin, origin);

    mqtt.subscribe(`*/${Kind.Publish}/${topic}`, {qos: 0});
  }

  public destroy() {
    this.mqtt.subscribe(`*/${Kind.Publish}/${this.topic}`, {qos: 0});
  }
}
