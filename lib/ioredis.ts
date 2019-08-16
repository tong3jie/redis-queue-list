import * as Ioredis from 'ioredis';
import * as assert from 'assert';
import { convertObjectToArray } from './util';

export class RedisQueues {
  public Client: any;

  public Config: any;

  public Redis: any;

  constructor(config) {
    this.Config = config || {};

    if (config.cluster === true) {
      assert(config.nodes && config.nodes.length !== 0, 'redis cluster config error');
      config.nodes.forEach(
        (node: any): void => {
          assert(
            node.host && node.port && node.password !== undefined && node.db !== undefined,
            `reids 'host: ${node.host}', 'port: ${node.port}', 'password: ${node.password}', 'db: ${node.db}' are required on config`,
          );
        },
      );

      this.Client = new Ioredis.Cluster(config.nodes, config);
    } else if (config.sentinel) {
      assert(config.sentinels && config.sentinels.length !== 0, 'redis sentinels configuration is required when use redis sentinel');
      config.sentinels.forEach(
        (sentinel: any): void => {
          assert(sentinel.host && sentinel.port, `redis 'host: ${sentinel.host}', 'port: ${sentinel.port}' are required on config`);
        },
      );

      assert(
        config.name && config.password !== undefined && config.db !== undefined,
        `redis 'name of master: ${config.name}', 'password: ${config.password}', 'db: ${config.db}' are required on config`,
      );

      this.Client = new Ioredis(config);
    } else if (config.clients) {
      const redisMap = new Map();
      if (this.Config.clients) {
        for (const [key, node] of Object.entries(this.Config.clients)) {
          redisMap.set(key, new Ioredis(node));
        }
      }
      this.Redis = redisMap;
    } else {
      assert(
        config.host && config.port && config.password !== undefined && config.db !== undefined,
        `redis 'host: ${config.host}', 'port: ${config.port}', 'password: ${config.password}', 'db: ${config.db}' are required on config`,
      );

      this.Client = new Ioredis(config);
    }

    Ioredis.Command.setArgumentTransformer(
      'xadd',
      (args): any => {
        if (args.length === 3) {
          if (typeof args[2] === 'object' && args[1] !== null) {
            return [args[0]].concat(args[1]).concat(convertObjectToArray(args[2]));
          }
        }
        if (args.length === 5) {
          if (args[1].toLocaleLowerCase() === 'maxlen' && typeof args[2] === 'number' && typeof args[4] === 'object' && args[3] !== null) {
            return [args[0]]
              .concat(args[1])
              .concat(args[2])
              .concat(args[3])
              .concat(convertObjectToArray(args[4]));
          }
        }
        return args;
      },
    );

    if (this.Client) {
      this.Client.on('connect', () => {
        console.log('redis was connected!');
      });
      this.Client.on('disconnect', () => {
        console.log('redis was disconnected!');
      });
      this.Client.on('error', (err) => {
        console.log(err);
      });
    }
  }
}
