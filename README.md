a message queue by redis list.
Supports Redis >= 3.0.0 and (Node.js >= 8).

# Quick Start

## Install

```shell
$ npm install redis-queue-liist
```

## Basic Usage

```javascript
const redisQueue = require('redis-queue-list').RedisQueue;
const RedisQ = new redisQueue(config, option);
RedisQ.push(JSON.stringify({ a: 1, b: i }), 'send', 5);
//  enqueue
const message = RedisQ.pull('send');
//  dequeue
RedisQ.ack(message, 'send');
//   confirm
```

## Mulit Clients

```javascript
const redisQueue = require('redis-queue-list').MulitRedis;
const RedisQ = new redisQueue(config, option);
RedisQ.Redis.get('foo').push(JSON.stringify({ a: 1, b: i }), 'send', 5);
//  enqueue
const message = RedisQ.Redis.get('foo').pull('send');
//  dequeue
RedisQ.Redis.get('foo').ack(message, 'send');
//   confirm
```

## option

```javascript
{
  Priority: 6, // Priority
  queueNames: ['send', 'notify'], //  all queueName
  pendingTime: 10000, // retry time
},
```

## Configuration

**Single Client**

```javascript
config = {
  port: 6379, //  port
  host: '127.0.0.1', //  host
  password: 'auth',
  db: 0,
};
```

**Multi Clients**

```javascript
config = {
  clients: {
    foo: {
      port: 6379, // Redis port
      host: '127.0.0.1', // Redis host
      password: 'auth',
      db: 0,
    },
    bar: {
      port: 6379,
      host: '127.0.0.1',
      password: 'auth',
      db: 1,
    },
  },
};
```

**Sentinel**

```javascript
config = {
  sentinels: [
    {
      port: 26379, // Sentinel port
      host: '127.0.0.1', // Sentinel host
    },
  ],
  name: 'mymaster', // Master name
  password: 'auth',
  db: 0,
};
```

**Cluster**

```javascript
config = {
  cluster: true,
  nodes: [
    {
      host: '127.0.0.1',
      port: '6379',
      family: 'user',
      password: 'password',
      db: 'db',
    },
    {
      host: '127.0.0.1',
      port: '6380',
      family: 'user',
      password: 'password',
      db: 'db',
    },
  ],
};
```

---

## Questions & Suggestions

Please open an issue [here](https://github.com/tong3jie/redis-queue-list/issues).
