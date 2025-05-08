export interface IEventHandler {
	handle(topic: string, data: unknown): void;
}
