import { EventEmitter } from 'events';
import logger from '../utils/logger';
import type { EventType } from '../utils/constants';

type Handler = (payload: Record<string, unknown>) => Promise<void> | void;

class EventBus extends EventEmitter {
  private static instance: EventBus;
  private registeredEvents: Map<EventType, Handler[]>;

  private constructor() {
    super();
    this.registeredEvents = new Map();
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  emit(event: EventType, payload: Record<string, unknown>): boolean {
    logger.info(`EventBus: Emitting "${event}"`, { event, payload });
    return super.emit(event, payload);
  }

  on(event: EventType, handler: Handler): this {
    const wrappedHandler = async (payload: Record<string, unknown>) => {
      try {
        await handler(payload);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error(`EventBus: Handler error for event "${event}": ${message}`, {
          event,
          error: err instanceof Error ? err.stack : String(err),
        });
      }
    };

    const handlers = this.registeredEvents.get(event) || [];
    handlers.push(handler);
    this.registeredEvents.set(event, handlers);
    super.on(event, wrappedHandler);
    logger.debug(`EventBus: Registered handler for "${event}"`);
    return this;
  }

  getRegisteredEvents(): Record<string, Handler[]> {
    return Object.fromEntries(this.registeredEvents);
  }
}

export default EventBus;
