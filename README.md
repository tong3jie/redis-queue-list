a message queue by redis list.
Supports Redis >= 3.0.0 and (Node.js >= 8).

# Quick Start

## Install

```shell
$ npm install redis-queue-liist
```

## Basic Usage

```javascript
const redisQueue = require('redis-queue-list');
const RedisQ = new redisQueue(config, option);
RedisQ.push(JSON.stringify({ a: 1, b: i }), 'send', 5);
//  enqueue
const message = RedisQ.pull('send');
//  dequeue
RedisQ.ack('send');
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

```
config = {
    port: 6379,          //  port
    host: '127.0.0.1',   //  host
    password: 'auth',
    db: 0,
}
```

**Multi Clients**

```
config = {
    foo: {                 // instanceName. See below
      port: 6379,          // Redis port
      host: '127.0.0.1',   // Redis host
      password: 'auth',
      db: 0,
    },
    bar: {
      port: 6379,
      host: '127.0.0.1',
      password: 'auth',
      db: 1,
    },
}
```

**Sentinel**

```
config = {
    sentinels: [{          // Sentinel instances
      port: 26379,         // Sentinel port
      host: '127.0.0.1',   // Sentinel host
    }],
    name: 'mymaster',      // Master name
    password: 'auth',
    db: 0
}
```

**Cluster**

```
config = {
     cluster: true,
     nodes: [{
       host: '127.0.0.1',
       port: '6379',
       family: 'user',
       password: 'password',
       db: 'db',
     }, {
       host: '127.0.0.1',
       port: '6380',
       family: 'user',
       password: 'password',
       db: 'db',
     }]
};
```

---

## Questions & Suggestions

Please open an issue [here](https://github.com/tong3jie/redis-queue-stream/issues).
