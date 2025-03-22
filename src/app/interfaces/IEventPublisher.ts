export interface IEventPublisher {
  publish(eventName: string, data: any): Promise<void>;
}