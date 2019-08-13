import * as assert from 'assert';

const objectToString = (obj): string => Object.prototype.toString.call(obj);

/**
 * 判断数据类型是否为Object
 * @param {object} arg 判断对象
 */
export const isObject = (arg): boolean => objectToString(arg) === '[object Object]';

/**
 * 将object转化为数组
 * @param {object} obj 转化对象
 */
export const convertObjectToArray = (obj): [] => {
  const result: any = [];
  for (const [key, value] of Object.entries(obj)) {
    result.push(key, value);
  }
  return result;
};
export const redisRty = async function (...callback): Promise<void> {
  const result = await Promise.all([...callback]);
  if (result.includes(0)) {
    this.redisRty(this.Arrayzip(result, [...callback]));
  }
};

export const Arrayzip = (array1: any[], array2: any[], value): any[] => {
  assert(array1.length === array2.length, "array1's length and array2's length must be  equal");
  return array1.filter((item, index) => {
    if (item === value) return array2[index];
  });
};
