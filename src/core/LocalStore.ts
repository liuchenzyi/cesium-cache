// db.js
import Dexie, {type EntityTable} from 'dexie';

interface Cache {
    url: string;
    value: any;
}

const db = new Dexie('LocalStore') as Dexie & {
    cache: EntityTable<Cache, 'url'>
};
db.version(1).stores({
    cache: '++id, &url, value', // id 自动生成主键，url 唯一索引
});

// 通过 url 获取数据
const getCacheByUrl = async (url: string) => {
    const {value} = await db.cache.get(url) || {}
    return value
}

// 将数据 存储到数据库中
const setCacheToLocal = async (url: string, value: any) => {
    await db.cache.put({value, url})
}

// 清除所有 缓存
const clearCache = async () => {
    await db.cache.clear()
}

// 暴露接口
export const LocalStore = {
    getCacheByUrl,
    setCacheToLocal,
    clearCache
}

