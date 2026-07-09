import { ApiException } from '../http/http.exception';

type Nullish = null | undefined;

export class Mapper<K, V> {
  private _mem: Map<K, V>;

  constructor() {
    this._mem = new Map();
  }

  get(key: K | Nullish): V | null {
    if (!key) {
      return null;
    }

    return this._mem.get(key) || null;
  }

  getOrThrow(key: K | Nullish): V {
    if (!key) {
      throw new ApiException(500, 'mapperGetOrThrowNokey');
    }

    const data = this._mem.get(key);
    if (!data) {
      throw new ApiException(500, 'mapperGetOrThrowNoData');
    }

    return data;
  }

  getIf(key: K | Nullish, cb: (v: V) => boolean): V | null {
    if (!key) return null;

    const data = this._mem.get(key);
    if (!data || !cb(data)) return null;

    return data;
  }

  getIfOrThrow(key: K | Nullish, cb: (v: V) => boolean): V {
    if (!key) {
      throw new ApiException(500, 'mapperGetIfOrThrowNoKey');
    }

    const data = this._mem.get(key);
    if (!data) {
      throw new ApiException(500, 'mapperGetIfOrThrowNoData');
    }

    if (!cb(data)) {
      throw new ApiException(500, 'mapperGetIfOrThrowPredicateFailed');
    }

    return data;
  }

  set(key: K, value: V) {
    this._mem.set(key, value);
  }
}

export function getIdMapper<T extends { id: string }>(
  objs: T[] | T,
): Mapper<string, T> {
  const mapper = new Mapper<string, T>();
  if (!Array.isArray(objs)) {
    if (objs.id) {
      mapper.set(objs.id, objs);
    }

    return mapper;
  }

  for (const obj of objs) {
    if (!obj.id) {
      continue;
    }

    mapper.set(obj.id, obj);
  }

  return mapper;
}
