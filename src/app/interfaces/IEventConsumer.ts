export interface IEventConsumer {
  subscribe(topics: string[], handler: (topic: string, data: any) => Promise<void>): Promise<void>;
}