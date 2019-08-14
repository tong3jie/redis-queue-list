"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const objectToString = (obj) => Object.prototype.toString.call(obj);
/**
 * 判断数据类型是否为Object
 * @param {object} arg 判断对象
 */
exports.isObject = (arg) => objectToString(arg) === '[object Object]';
/**
 * 将object转化为数组
 * @param {object} obj 转化对象
 */
exports.convertObjectToArray = (obj) => {
    const result = [];
    for (const [key, value] of Object.entries(obj)) {
        result.push(key, value);
    }
    return result;
};
exports.redisRty = function (...callback) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield Promise.all([...callback]);
        if (result.includes(0)) {
            this.redisRty(this.Arrayzip(result, [...callback], 0));
        }
    });
};
exports.Arrayzip = (array1, array2, value) => {
    assert(array1.length === array2.length, "array1's length and array2's length must be  equal");
    return array1
        .map((item, index) => {
        if (item === value)
            return array2[index];
    })
        .filter(Boolean);
};
