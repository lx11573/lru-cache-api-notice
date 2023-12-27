import md5 from 'md5';

/**
 * LRU 缓存, 重复 api 通知功能
 * @Author: lyu
 * @Date: 2022-02-26 22:38:22
 * @param {Number} maxCache 缓存最大数目
 * @param {Number} cacheTime 缓存过期时间, 单位：秒
 * @param {Boolean} storage 是否使用本地持久化
 * @param {Array} blackList 禁用缓存名称
 * @param {Boolean} useNotice 启用 api 通知功能
 */
export interface LruCacheOptions {
  maxCache?: number;
  cacheTime?: number;
  storage?: boolean;
  blackList?: string[];
  useNotice?: boolean;
}
interface LruCacheData<T> {
  data: T;
  storeTime: number;
}
/** 默认使用 sessionStorage */
const storage = window.sessionStorage;

export class LruCache {
  private maxCache: number;

  private cacheTime: number;

  private storage: boolean;

  private blackList: string[];

  private requestCache: Map<string, LruCacheData<any>>;

  private subscribes: Map<string, [(value: any | PromiseLike<any>) => void, (reason?: any) => void][]> = new Map();

  useNotice?: boolean;

  constructor(options: LruCacheOptions = {}) {
    const cacheTime = options.cacheTime || 10;
    this.maxCache = options.maxCache || 20;
    this.cacheTime = cacheTime * 1000;
    this.storage = options.storage || false;
    this.blackList = options.blackList || [];
    this.requestCache = new Map();
    this.useNotice = options.useNotice;
  }

  private isExpired<T>(hashKey: string): boolean {
    const cache = this.requestCache.get(hashKey) as LruCacheData<T>;
    const expired = Date.now() - cache.storeTime > this.cacheTime;

    if (this.useNotice && expired) {
      this.subscribes.delete(hashKey);
    }
    return expired;
  }

  has(key: string): boolean {
    const hashKey = this.getHashKey(key);
    return this.requestCache.has(hashKey);
  }

  get<T = any>(key: string): Promise<T> | null {
    if (this.blackList.includes(key)) return null;

    const hashKey = this.getHashKey(key);

    if (!this.requestCache.has(hashKey) || this.isExpired<T>(hashKey)) {
      if (this.useNotice) {
        return this.handleNotice(key);
      }
      return null;
    }

    const cache = this.requestCache.get(hashKey) as LruCacheData<T>;
    // 重新存储缓存内容
    this.requestCache.delete(hashKey);
    this.requestCache.set(hashKey, cache);
    return Promise.resolve(cache.data);
  }

  set<T>(key: string, value: any) {
    if (this.blackList.includes(key)) return;

    const hashKey = this.getHashKey(key);

    if (this.requestCache.has(hashKey)) {
      this.requestCache.delete(hashKey);
      this.storage && storage.removeItem(hashKey);
    } else if (this.requestCache.size >= this.maxCache) {
      const firstKey = this.requestCache.keys().next().value;
      this.requestCache.delete(firstKey);
      this.storage && storage.removeItem(firstKey);
    }

    this.storage && storage.setItem(hashKey, JSON.stringify(value));
    this.requestCache.set(hashKey, {
      data: value,
      storeTime: Date.now()
    });
    this.useNotice && this.notice<T>(key, value);
  }

  delete(key: string) {
    const hashKey = this.getHashKey(key);
    this.requestCache.delete(hashKey);
    this.storage && storage.removeItem(hashKey);
  }

  clear() {
    this.requestCache.clear();
    this.storage && storage.clear();
  }
  getHashKey(key: string): string {
    return md5(key);
  }
  getBlackList() {
    return this.blackList;
  }

  getCacheTime() {
    return this.cacheTime;
  }

  getMaxCache() {
    return this.maxCache;
  }

  setBlackList(list: string[]) {
    this.blackList = [...this.blackList, ...list];
  }

  setCacheTime(second: number) {
    this.cacheTime = second * 1000;
  }

  setMaxCache(num: number) {
    this.maxCache = num;
  }

  setUseNotice(val: boolean) {
    this.useNotice = val;
  }

  private handleNotice<T>(key: string): Promise<T> | null {
    if (this.hasNotice(key)) {
      return this.addSubscribe(key);
    }

    this.addNotice(key);
    return null;
  }

  private addNotice(key: string) {
    const hashKey = this.getHashKey(key);
    this.subscribes.set(hashKey, []);
  }

  private notice<T>(key: string, data: any, success = true) {
    const hashKey = this.getHashKey(key);
    const subscribes = this.subscribes.get(hashKey);

    if (subscribes) {
      const values = subscribes.values();
      let curSubscribe = values.next();

      while (!curSubscribe.done) {
        const [resolve, reject] = curSubscribe.value;
        success ? resolve(data as T) : reject();
        curSubscribe = values.next();
      }

      this.subscribes.delete(hashKey);
    }
  }

  private hasNotice(key: string): boolean {
    const hashKey = this.getHashKey(key);
    return this.subscribes.has(hashKey);
  }

  private addSubscribe<T>(key: string): Promise<T> {
    const hashKey = this.getHashKey(key);
    return new Promise((resolve, reject) => {
      const curSubscribe = this.subscribes.get(hashKey)!;
      curSubscribe.push([resolve, reject]);
      this.subscribes.set(hashKey, curSubscribe);
    });
  }

  noticeReject(key: string) {
    const hashKey = this.getHashKey(key);

    if (this.subscribes.has(hashKey)) {
      this.notice(key, null, false);
    }
  }
}
/** 单例模式 */
function create(): (options?: LruCacheOptions) => LruCache {
  let lruCache: LruCache;
  return (options?: LruCacheOptions): LruCache => {
    if (lruCache) return lruCache;

    lruCache = new LruCache(options);
    return lruCache;
  };
}

const createLruCache = create();

export { createLruCache };

export default LruCache;
