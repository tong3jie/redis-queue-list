import * as assert from 'assert';
import * as events from 'events';
import * as sleep from 'mz-modules/sleep';
import { RedisOptions } from 'ioredis';
import { RedisQueues } from './lib/ioredis';

const { EventEmitter } = events;
export class RedisQueue extends RedisQueues {
  public pendingTime: number;

  public Priority: number;

  public queueNames: string[];

  public checkTime: number;

  constructor(config: Config, options: Options) {
    super(config);
    this.Priority = options.Priority || 1;
    this.queueNames = options.queueNames;
    this.pendingTime = options.pendingTime || 1000 * 60 * 5;
    this.checkTime = options.checkTime || 1000 * 60 * 10;
    const pendingEvent = new EventEmitter();
    pendingEvent.on('pending', async () => {
      for (let level = this.Priority; level > 0; level--) {
        for (const queueName of this.queueNames) {
          const message: null | string = await this.Client.rpoplpush(`{${queueName}:L${level}}:ING`, `{${queueName}:L${level}}:ING`);
          if (!message) continue;

          const timeStamp: string[] = message.match(/[0-9]{13}$/g);
          const messageInfo = message.replace(/:[0-9]{13}/g, '');
          const isAck = await this.Client.sismember(queueName, messageInfo);
          if (isAck) {
            this.Client.pipeline()
              .lrem(`{${queueName}:L${level}}:ING`, 1, message)
              .srem(queueName, messageInfo);
          } else if (Date.now() - new Date(parseInt(timeStamp[0], 10)).getTime() > this.pendingTime) {
            this.Client.lrem(`{${queueName}:L${level}}:ING`, 1, message);
            this.push(message.slice(0, -14), queueName, level);
          }
        }
      }
      await sleep(1);
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
  async push(message: string, queueName: string, Priority = this.Priority): Promise<void> {
    assert(message.length !== 0, 'push message must be required!');
    await this.Client.lpush(`{${queueName}:L${Priority}}`, `${message}:${Date.now()}`);
  }

  /**
   * 出队
   * @param queueName 队列名称
   */
  async pull(queueName: string): Promise<string> {
    assert(queueName.length !== 0, 'message must be required!');
    let level = this.Priority;
    let message = '';
    do {
      // message = await this.Client.rpop(`{${queueName}:L${level}}:ING`);

      // if (message) {
      //   level--;
      //   break;
      // }
      message = await this.Client.rpoplpush(`{${queueName}:L${level}}`, `{${queueName}:L${level}}:ING`);
      if (message) {
        level--;
        break;
      }
    } while (level === 0);
    return message ? message.slice(0, -14) : null;
  }

  /**
   * 消息确认
   * @param message 消息内容
   * @param queueName 队列名称
   */
  async ack(message: string, queueName: string): Promise<void> {
    assert(message.length !== 0, 'ack message must be required!');
    assert(this.queueNames.includes(queueName), 'ack queueName is not defined');
    this.Client.sadd(queueName, Date.now(), message);
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
  checkTime: number;
}
