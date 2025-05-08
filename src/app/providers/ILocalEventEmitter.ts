export interface ILocalEventEmitter {
	emit(eventName: string, data: any): void;
	on(eventName: string, handler: (data: any) => void): void;
}
