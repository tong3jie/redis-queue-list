import * as Ioredis from 'ioredis';
import * as assert from 'assert';
import { convertObjectToArray } from './util';

export class RedisQueues {
  public Client: any;

  constructor(config) {
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
    } else if (config.sentinels) {
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
