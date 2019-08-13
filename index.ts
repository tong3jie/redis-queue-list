/* eslint-disable no-extra-label */
import * as assert from 'assert';
import * as events from 'events';
import * as sleep from 'mz-modules/sleep';
import { RedisOptions } from 'ioredis';
import { RedisQueues } from './lib/ioredis';
import { redisRty } from './lib/util';

const { EventEmitter } = events;
export class RedisQueue extends RedisQueues {
  public pendingTime: number;

  public Priority: number;

  public queueNames: string[];

  private level: Set<string | number>;

  constructor(config: Config, options: Options) {
    super(config);
    this.Priority = options.Priority || 1;
    this.queueNames = options.queueNames;
    this.pendingTime = options.pendingTime || 1000 * 60 * 5;
    const pendingEvent = new EventEmitter();
    this.level = new Set(options.queueNames);

    pendingEvent.on('pending', async () => {
      // eslint-disable-next-line no-labels
      top: for (let level = 1; level <= this.Priority; level++) {
        // eslint-disable-next-line no-labels
        if (!this.level.has(level)) continue top;

        // eslint-disable-next-line no-labels
        down: for (const queueName of this.queueNames) {
          // eslint-disable-next-line no-labels
          if (!this.level.has(queueName)) continue down;

          const message: null | string = await this.Client.rpoplpush(`{${queueName}:L${level}}:ING`, `{${queueName}:L${level}}:ING`);

          // eslint-disable-next-line no-labels
          if (!message) continue down;

          const timeStamp: string[] = message.match(/[0-9]{13}$/g);

          const messageInfo = message.replace(/:[0-9]{13}/g, '');
          const isAck = await this.Client.sismember(queueName, messageInfo);
          if (isAck) {
            redisRty(this.Client.lrem(`{${queueName}:L${level}}:ING`, 1, message), this.Client.srem(queueName, messageInfo));
          } else if (Date.now() - new Date(parseInt(timeStamp[0], 10)).getTime() > this.pendingTime) {
            redisRty(this.Client.lrem(`{${queueName}:L${level}}:ING`, 1, message), this.Client.lpush(`{${queueName}:L${level}}`, `${message.slice(0, -14)}:${Date.now()}`));
          }
        }
      }

      await sleep(0);
      pendingEvent.emit('pending');
    });
    pendingEvent.emit('pending');
  }

  /**
   * 入队
   * @param message 消息内容
   * @param queueName   队列名称
   * @param Priority    优先级
   */
  async push(message: string, queueName: string, Priority = 1): Promise<void> {
    assert(message.length !== 0, 'push message must be required!');
    assert(this.queueNames.includes(queueName), `queueName must be defined at opttion,bust ${queueName}!`);
    this.level.add(Priority);
    this.level.add(queueName);
    await this.Client.lpush(`{${queueName}:L${Priority}}`, `${message}:${Date.now()}`);
  }

  /**
   * 出队
   * @param queueName 队列名称
   */
  async pull(queueName: string): Promise<string> {
    assert(queueName.length !== 0, `queueName must be required,bust ${queueName}!`);
    assert(this.queueNames.includes(queueName), `queueName must be defined at opttion,bust ${queueName}!`);
    let level = this.Priority;
    let message = '';
    do {
      if (!this.level.has(level)) {
        level--;
        continue;
      }
      message = await this.Client.rpoplpush(`{${queueName}:L${level}}`, `{${queueName}:L${level}}:ING`);
      level--;
      if (message) {
        break;
      }
    } while (level !== 0);

    return message ? message.slice(0, -14) : null;
  }

  /**
   * 消息确认
   * @param message 消息内容
   * @param queueName 队列名称
   */
  async ack(message: string, queueName: string): Promise<void> {
    // assert(message && message.length !== 0, `ack message must be required. but ${message}!`);
    // assert(this.queueNames.includes(queueName), 'ack queueName is not defined');
    if (!message) return;
    this.Client.sadd(queueName, message);
  }
}

export interface Config {
  readonly cluster?: boolean;
  readonly nodes?: RedisOptions[];
  readonly sentinels?: boolean;
  readonly clients?: Record<string, RedisOptions>;
  natMap?: any;
  scaleReads?: any;
}

interface Options {
  Priority: number /* 队列总体等级 */;
  queueNames: string[];
  pendingTime: number;
}
