/**
 * 角色订阅器
 * @module core/services/domain/character-subscriber
 *
 * 封装原 CharacterService.listeners 数组 + subscribe / notifyChange。
 * 工厂模式创建独立实例，便于多项目场景共享。
 */

import type { Character } from '@/core/types';

/** 订阅者回调签名 */
export type CharacterListener = (characters: Character[]) => void;

/** 订阅器接口 */
export interface CharacterSubscriber {
  /** 订阅变更，返回取消订阅函数 */
  subscribe: (listener: CharacterListener) => () => void;
  /** 通知所有订阅者 */
  notify: (characters: Character[]) => void;
}

/**
 * 创建一个角色订阅器实例
 */
export function createCharacterSubscriber(): CharacterSubscriber {
  let listeners: CharacterListener[] = [];

  return {
    subscribe(listener) {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
    notify(characters) {
      for (const listener of listeners) {
        listener(characters);
      }
    },
  };
}
