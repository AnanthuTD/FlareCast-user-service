import { EventEmitter } from "events";
import { ILocalEventEmitter } from "@/app/providers/ILocalEventEmitter";

export class LocalEventEmitter implements ILocalEventEmitter {
  private emitter = new EventEmitter();

  emit(eventName: string, data: any): void {
    this.emitter.emit(eventName, data);
  }

  on(eventName: string, handler: (data: any) => void): void {
    this.emitter.on(eventName, handler);
  }
}