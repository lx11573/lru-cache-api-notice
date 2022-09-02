<!--
 * @Author: lyu
 * @Date: 2022-08-10 16:57:21
-->
<h1 align="center"><samp>LruCacheApiNotice</samp></h1>

<p align="center">
  <samp>一个 lruCache 缓存功能，附带 api 通知功能</samp>
</p>

## 安装

```bash
# npm
npm i lru-cache-api-notice
# pnpm
pnpm add lru-cache-api-notice
```

## 使用

```ts
// 在 main.js 中引入并设定参数
import { createLruCache, default as LruCache } from 'lru-cache-api-notice'
const options = {
	// 缓存时长, 单位：s
	cacheTime: 10,
	// 最大缓存数量
	maxCache: 20,
	// 启用本地存储，正式环境不推荐
	storage: localStorage || false,
	// 禁用缓存名单
	blackList: [],
	// 启用 api 通知功能
	useNotice: true
}
// 方式一
const lruCache = new LruCache(options)
// 方式二，单例
const lruCache = createLruCache(options)
// 修改参数
lruCache.setCacheTime(20)



// http.js 中引入
import { createLruCache } from 'lru-cache-api-notice'
const lruCache = createLruCache()

// request
const getCacheData = lruCache.get(key/* 根据请求接口生成的唯一 key */) ?? null
if (getCacheData !== null) {
	// 命中缓存
	return getCacheData
}

// response
lruCache.set(key, value)
```

## lruCache
- 使用 lruCache 后，所有请求结果均会被缓存(建议只对 get 请求做缓存处理)。如果缓存存在且在缓存有效期内，所有请求均不会发送(需自行处理)
- 使用 useNotice 后，相同 key 的请求只会发送一次，其余请求会在第一个请求结果返回后，进行通知(失败时需自行调用 noticeReject)
```ts
// main.js

lruCache.setUseNotice(true)
function getData() {
	http.get('url')	
}
getData()
getData()
getData()
// response
if (lruCache.useNotice && responseFail) {
	lruCache.noticeReject(key)
}
```

## License

[MIT](./LICENSE) License © 2022 [Owner](https://github.com/lx11573)