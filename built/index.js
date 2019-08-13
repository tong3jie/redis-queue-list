"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const events = require("events");
const sleep = require("mz-modules/sleep");
const ioredis_1 = require("./lib/ioredis");
const util_1 = require("./lib/util");
const { EventEmitter } = events;
class RedisQueue extends ioredis_1.RedisQueues {
    constructor(config, options) {
        super(config);
        this.Priority = options.Priority || 1;
        this.queueNames = options.queueNames;
        this.pendingTime = options.pendingTime || 1000 * 60 * 5;
        const pendingEvent = new EventEmitter();
        pendingEvent.on('pending', () => __awaiter(this, void 0, void 0, function* () {
            console.time('pending');
            for (let level = this.Priority; level > 0; level--) {
                for (const queueName of this.queueNames) {
                    const message = yield this.Client.rpoplpush(`{${queueName}:L${level}}:ING`, `{${queueName}:L${level}}:ING`);
                    if (!message)
                        continue;
                    const timeStamp = message.match(/[0-9]{13}$/g);
                    const messageInfo = message.replace(/:[0-9]{13}/g, '');
                    const isAck = yield this.Client.sismember(queueName, messageInfo);
                    if (isAck) {
                        util_1.redisRty(this.Client.lrem(`{${queueName}:L${level}}:ING`, 1, message), this.Client.srem(queueName, messageInfo));
                    }
                    else if (Date.now() - new Date(parseInt(timeStamp[0], 10)).getTime() > this.pendingTime) {
                        util_1.redisRty(this.Client.lrem(`{${queueName}:L${level}}:ING`, 1, message), this.Client.lpush(`{${queueName}:L${level}}`, `${message.slice(0, -14)}:${Date.now()}`));
                    }
                }
            }
            console.timeEnd('pending');
            yield sleep(0);
            pendingEvent.emit('pending');
        }));
        pendingEvent.emit('pending');
    }
    /**
     * 入队
     * @param message 消息内容
     * @param queueName   队列名称
     * @param Priority    优先级
     */
    push(message, queueName, Priority = this.Priority) {
        return __awaiter(this, void 0, void 0, function* () {
            assert(message.length !== 0, 'push message must be required!');
            yield this.Client.lpush(`{${queueName}:L${Priority}}`, `${message}:${Date.now()}`);
        });
    }
    /**
     * 出队
     * @param queueName 队列名称
     */
    pull(queueName) {
        return __awaiter(this, void 0, void 0, function* () {
            assert(queueName.length !== 0, 'message must be required!');
            let level = this.Priority;
            let message = '';
            do {
                message = yield this.Client.rpoplpush(`{${queueName}:L${level}}`, `{${queueName}:L${level}}:ING`);
                if (message) {
                    level--;
                    break;
                }
            } while (level === 0);
            return message ? message.slice(0, -14) : null;
        });
    }
    /**
     * 消息确认
     * @param message 消息内容
     * @param queueName 队列名称
     */
    ack(message, queueName) {
        return __awaiter(this, void 0, void 0, function* () {
            assert(message.length !== 0, 'ack message must be required!');
            assert(this.queueNames.includes(queueName), 'ack queueName is not defined');
            this.Client.sadd(queueName, message);
        });
    }
}
exports.RedisQueue = RedisQueue;
