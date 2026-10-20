/**
 * plugin-sdk.test.ts — Unit tests for @kineo/plugin-sdk package
 */

import { pluginRegistry, type KineoPlugin } from '../../../packages/plugin-sdk/src/index';

describe('@kineo/plugin-sdk Package Suite', () => {
  it('Should initialize 5 built-in plugins matrix in @kineo/plugin-sdk', () => {
    const plugins = pluginRegistry.getAll();
    expect(plugins.length).toBeGreaterThanOrEqual(5);
  });

  it('Should execute waterfall hooks via @kineo/plugin-sdk', async () => {
    const customPlugin: KineoPlugin = {
      id: 'plugin-sdk-unit-test',
      name: 'SDK Unit Test Plugin',
      version: '1.0.0',
      description: 'SDK unit test plugin',
      hooks: {
        onBeforeScriptParse: (text) => `${text} -> SDK Hooked`,
      },
    };

    pluginRegistry.register(customPlugin);
    const result = await pluginRegistry.executeHook('onBeforeScriptParse', 'Start');
    expect(result).toContain('SDK Hooked');

    pluginRegistry.unregister('plugin-sdk-unit-test');
  });
});
