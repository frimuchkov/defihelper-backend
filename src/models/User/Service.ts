import { Factory } from '@services/Container';
import { RedisClient } from 'redis';
import { v4 as uuid } from 'uuid';
import { User, Table as UserTable, Role } from './Entity';

export class UserService {
  constructor(readonly table: Factory<UserTable> = table) {}

  async create(role: Role) {
    const created = {
      id: uuid(),
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.table().insert(created);

    return created;
  }

  async update(user: User) {
    const updated = {
      ...user,
      updatedAt: new Date(),
    };
    await this.table().where({ id: user.id }).update(updated);

    return updated;
  }

  async delete(contract: User) {
    await this.table().where({ id: contract.id }).delete();
  }
}

export class SessionService {
  constructor(
    readonly cache: Factory<RedisClient> = cache,
    readonly prefix: string = prefix,
    readonly ttl: number = ttl,
  ) {}

  generate(user: User) {
    const cache = this.cache();
    const sid = uuid();
    const key = `${this.prefix}:${sid}`;
    cache.set(key, user.id);
    cache.expire(key, this.ttl);

    return sid;
  }

  get(sid: string): Promise<string | null> {
    const cache = this.cache();
    const key = `${this.prefix}:${sid}`;

    return new Promise((resolve, reject) =>
      cache.get(key, (err, id) => {
        if (err) return reject(err);
        if (id) cache.expire(key, this.ttl);

        resolve(id);
      }),
    );
  }
}
