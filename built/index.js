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
/* eslint-disable no-extra-label */
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
        this.level = new Set();
        pendingEvent.on('pending', () => __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line no-labels
            top: for (let level = 1; level <= this.Priority; level++) {
                // eslint-disable-next-line no-labels
                if (!this.level.has(level))
                    continue top;
                // eslint-disable-next-line no-labels
                down: for (const queueName of this.queueNames) {
                    // eslint-disable-next-line no-labels
                    if (!this.level.has(queueName))
                        continue down;
                    const message = yield this.Client.rpoplpush(`{${queueName}:L${level}}:ING`, `{${queueName}:L${level}}:ING`);
                    // eslint-disable-next-line no-labels
                    if (!message)
                        continue down;
                    const timeStamp = message.match(/[0-9]{13}$/g);
                    const messageInfo = message.replace(/:[0-9]{13}/g, '');
                    const isAck = yield this.Client.sismember(queueName, messageInfo);
                    if (isAck) {
                        // confirm message was Acked
                        util_1.redisRty(this.Client.lrem(`{${queueName}:L${level}}:ING`, 1, message), this.Client.srem(queueName, messageInfo));
                    }
                    else if (Date.now() - new Date(parseInt(timeStamp[0], 10)).getTime() > this.pendingTime) {
                        // confirm pendingTime
                        util_1.redisRty(this.Client.lrem(`{${queueName}:L${level}}:ING`, 1, message), this.Client.lpush(`{${queueName}:L${level}}`, `${message.slice(0, -14)}:${Date.now()}`));
                    }
                }
            }
            yield sleep(0);
            pendingEvent.emit('pending');
        }));
        pendingEvent.on('checkName', () => __awaiter(this, void 0, void 0, function* () {
            if (config.cluster) {
                const clusterNodes = this.Client.nodes('master');
                for (const node of clusterNodes) {
                    for (const queueName of this.queueNames) {
                        const result = yield node.scan(0, 'match', `*${queueName}*`);
                        if (result[1].length === 0) {
                            this.level.delete(queueName);
                            continue;
                        }
                    }
                }
            }
            else {
                for (const queueName of this.queueNames) {
                    const result = yield this.Client.scan(0, 'match', `*${queueName}*`);
                    if (result[1].length === 0) {
                        this.level.delete(queueName);
                        continue;
                    }
                }
            }
            yield sleep(1000 * 60);
            pendingEvent.emit('checkName');
        }));
        pendingEvent.emit('pending');
        pendingEvent.emit('checkName');
    }
    /**
     * 入队
     * @param message {string} 消息内容
     * @param queueName {string}  队列名称
     * @param Priority  {number}  优先级,默认为1
     */
    push(message, queueName, Priority = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            assert(message.length !== 0, 'push message must be required!');
            assert(this.queueNames.includes(queueName), `queueName must be defined at opttion,bust ${queueName}!`);
            this.level.add(Priority).add(queueName);
            util_1.redisRty(this.Client.lpush(`{${queueName}:L${Priority}}`, `${message}:${Date.now()}`));
        });
    }
    /**
     * 出队
     * @param queueName {string} 队列名称
     */
    pull(queueName) {
        return __awaiter(this, void 0, void 0, function* () {
            assert(queueName.length !== 0, `queueName must be required,bust ${queueName}!`);
            assert(this.queueNames.includes(queueName), `queueName must be defined at opttion,bust ${queueName}!`);
            let level = this.Priority;
            let message = '';
            do {
                if (!this.level.has(level)) {
                    level--;
                    continue;
                }
                message = yield this.Client.rpoplpush(`{${queueName}:L${level}}`, `{${queueName}:L${level}}:ING`);
                level--;
                if (message) {
                    break;
                }
            } while (level !== 0);
            return message ? message.slice(0, -14) : null;
        });
    }
    /**
     * 消息确认
     * @param message {string} 消息内容
     * @param queueName {string} 队列名称
     */
    ack(message, queueName) {
        return __awaiter(this, void 0, void 0, function* () {
            // assert(message && message.length !== 0, `ack message must be required. but ${message}!`);
            // assert(this.queueNames.includes(queueName), 'ack queueName is not defined');
            if (!message)
                return;
            util_1.redisRty(this.Client.sadd(queueName, message));
        });
    }
}
exports.RedisQueue = RedisQueue;
