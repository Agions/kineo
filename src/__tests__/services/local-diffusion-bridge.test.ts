import { LocalDiffusionBridge } from '@/core/services/ai/image/LocalDiffusionBridge';

describe('LocalDiffusionBridge — 本地 ComfyUI / SD-WebUI 算力通道桥接测试', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('当 ComfyUI 在线时应成功探测并返回 comfyui 提供商', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('8188/system_stats')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ system: { os: 'darwin' } }),
        });
      }
      return Promise.reject(new Error('connection refused'));
    }) as any;

    const status = await LocalDiffusionBridge.detectActiveProvider();
    expect(status.available).toBe(true);
    expect(status.provider).toBe('comfyui');
    expect(status.endpoint).toBe('http://127.0.0.1:8188');
  });

  it('当 SD-WebUI 在线时应成功探测并返回 sd_webui 提供商', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('7860/sdapi/v1/options')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ sd_model_checkpoint: 'v1-5-pruned.ckpt' }),
        });
      }
      return Promise.reject(new Error('connection refused'));
    }) as any;

    const status = await LocalDiffusionBridge.detectActiveProvider();
    expect(status.available).toBe(true);
    expect(status.provider).toBe('sd_webui');
    expect(status.endpoint).toBe('http://127.0.0.1:7860');
  });

  it('SD-WebUI 应正确发送绘图参数并解析 Base64 图像数据', async () => {
    // 构造测试 base64
    const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/sdapi/v1/txt2img')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ images: [sampleBase64] }),
        });
      }
      return Promise.reject(new Error('404'));
    }) as any;

    const bytes = await LocalDiffusionBridge.generateWithWebUI({
      prompt: 'cyberpunk anime girl in rain',
      characterDna: ['银白色短发', '琥珀色瞳孔'],
      width: 512,
      height: 512,
    });

    expect(bytes).not.toBeNull();
    expect(bytes instanceof Uint8Array).toBe(true);
    expect(bytes!.length).toBeGreaterThan(0);
  });
});
