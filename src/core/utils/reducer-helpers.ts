/**
 * Reducer Field Updater 共享 Helper
 * 消除多个 reducer 中 makeSetter/createFieldUpdater 的跨文件重复
 */

/** 标准 updater 类型：支持直接值或函数式更新 */
export type FieldUpdater<T> = T | ((prev: T) => T);

type Action =
  | { type: 'set'; key: string; value: unknown }
  | { type: 'update'; key: string; updater: (prev: unknown) => unknown };

/**
 * 创建字段更新器：支持 `setValue(newValue)` 和 `setValue(prev => next)` 两种调用方式
 */
export function createFieldUpdater(dispatch: (action: Action) => void, key: string) {
  return <T>(payload: FieldUpdater<T>) => {
    if (typeof payload === 'function') {
      dispatch({ type: 'update', key, updater: payload as (prev: unknown) => unknown });
    } else {
      dispatch({ type: 'set', key, value: payload as unknown });
    }
  };
}
