/**
 * LocalDiffusionBridge.ts — 本地 ComfyUI / SD-WebUI (Forge) 直连通道与 IP-Adapter 角色一致性生图桥接
 *
 * 核心功能：
 * 1. 自动探测本地运行的 Stable Diffusion 生态服务：
 *    - ComfyUI 默认端口: http://127.0.0.1:8188
 *    - SD-WebUI / WebUI Forge 默认端口: http://127.0.0.1:7860
 * 2. 角色 Visual DNA 特征注入：将人物发型、瞳色、服装与 IP-Adapter / LoRA 触发词自动混编入 Prompt；
 * 3. 跨平台二进制流提取：自动解析 ComfyUI /view 图像二进制或 SD-WebUI Base64 并转换为 Uint8Array；
 * 4. 离线算力自由：允许创作者在无需消耗商业 API Token 的情况下，利用本地 RTX 显卡极速完成 4K 漫剧分镜生成。
 */

import { logger } from '@/core/utils/logger';

export interface LocalDiffusionOptions {
  endpoint?: string;
  prompt: string;
  negativePrompt?: string;
  characterDna?: string[];
  referenceImageUrl?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  sampler?: string;
}

export class LocalDiffusionBridge {
  private static defaultComfyEndpoint = 'http://127.0.0.1:8188';
  private static defaultWebUIEndpoint = 'http://127.0.0.1:7860';

  /**
   * 探测 ComfyUI 服务健康状态
   */
  public static async checkComfyUI(endpoint: string = this.defaultComfyEndpoint): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${endpoint.replace(/\/$/, '')}/system_stats`, {
        signal: controller.signal,
      });
      clearTimeout(id);
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * 探测 SD-WebUI / Forge 服务健康状态
   */
  public static async checkWebUI(endpoint: string = this.defaultWebUIEndpoint): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${endpoint.replace(/\/$/, '')}/sdapi/v1/options`, {
        signal: controller.signal,
      });
      clearTimeout(id);
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * 检测任意可用的本地生图后端
   */
  public static async detectActiveProvider(
    customComfy?: string,
    customWebUI?: string
  ): Promise<{
    available: boolean;
    provider?: 'comfyui' | 'sd_webui';
    endpoint?: string;
  }> {
    const comfyEp = customComfy || this.defaultComfyEndpoint;
    const webuiEp = customWebUI || this.defaultWebUIEndpoint;

    const isComfy = await this.checkComfyUI(comfyEp);
    if (isComfy) {
      return { available: true, provider: 'comfyui', endpoint: comfyEp };
    }

    const isWebUI = await this.checkWebUI(webuiEp);
    if (isWebUI) {
      return { available: true, provider: 'sd_webui', endpoint: webuiEp };
    }

    return { available: false };
  }

  /**
   * 通过 SD-WebUI / Forge API 生成画面并返回 Uint8Array
   */
  public static async generateWithWebUI(options: LocalDiffusionOptions): Promise<Uint8Array | null> {
    const endpoint = (options.endpoint || this.defaultWebUIEndpoint).replace(/\/$/, '');
    const dnaPrompt = options.characterDna && options.characterDna.length > 0
      ? `(${options.characterDna.join(', ')}:1.2), `
      : '';
    const fullPositivePrompt = `masterpiece, highly detailed anime visual, 8k wallpaper, manga drama, ${dnaPrompt}${options.prompt}`;
    const defaultNegative = 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry';

    try {
      logger.info(`[LocalDiffusionBridge] 发送 WebUI 绘图请求: "${fullPositivePrompt.slice(0, 50)}..."`);
      const payload: Record<string, unknown> = {
        prompt: fullPositivePrompt,
        negative_prompt: options.negativePrompt || defaultNegative,
        steps: options.steps || 24,
        cfg_scale: options.cfgScale || 7.0,
        width: options.width || 1280,
        height: options.height || 720,
        sampler_name: options.sampler || 'Euler a',
      };

      // 若有参考图，可结合 ControlNet / IP-Adapter 插件
      if (options.referenceImageUrl && options.referenceImageUrl.startsWith('data:image')) {
        payload.alwayson_scripts = {
          controlnet: {
            args: [
              {
                input_image: options.referenceImageUrl,
                module: 'ip-adapter_clip_sd15',
                model: 'ip-adapter_sd15',
                weight: 0.85,
              },
            ],
          },
        };
      }

      const res = await fetch(`${endpoint}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`SD-WebUI 响应异常: HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.images && data.images.length > 0) {
        const base64Data = data.images[0].replace(/^data:image\/\w+;base64,/, '');
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }
      return null;
    } catch (err) {
      logger.warn('[LocalDiffusionBridge] SD-WebUI 生图失败:', err);
      return null;
    }
  }

  /**
   * 通过 ComfyUI 标准工作流生成画面并提取二进制结果
   */
  public static async generateWithComfyUI(options: LocalDiffusionOptions): Promise<Uint8Array | null> {
    const endpoint = (options.endpoint || this.defaultComfyEndpoint).replace(/\/$/, '');
    const dnaPrompt = options.characterDna && options.characterDna.length > 0
      ? `(${options.characterDna.join(', ')}:1.2), `
      : '';
    const fullPositivePrompt = `masterpiece, highly detailed anime visual, 8k, dramatic manga lighting, ${dnaPrompt}${options.prompt}`;
    const defaultNegative = 'lowres, bad anatomy, bad hands, blurry, missing limbs';

    // 标准 ComfyUI SDXL/SD1.5 极简工作流 prompt 结构
    const seed = Math.floor(Math.random() * 1000000000);
    const comfyGraph = {
      '3': {
        inputs: {
          seed,
          steps: options.steps || 20,
          cfg: options.cfgScale || 7.0,
          sampler_name: 'euler_ancestral',
          scheduler: 'karras',
          denoise: 1,
          model: ['4', 0],
          positive: ['6', 0],
          negative: ['7', 0],
          latent_image: ['5', 0],
        },
        class_type: 'KSampler',
      },
      '4': {
        inputs: {
          ckpt_name: 'v1-5-pruned-emaonly.safetensors',
        },
        class_type: 'CheckpointLoaderSimple',
      },
      '5': {
        inputs: {
          width: options.width || 1280,
          height: options.height || 720,
          batch_size: 1,
        },
        class_type: 'EmptyLatentImage',
      },
      '6': {
        inputs: {
          text: fullPositivePrompt,
          clip: ['4', 1],
        },
        class_type: 'CLIPTextEncode',
      },
      '7': {
        inputs: {
          text: options.negativePrompt || defaultNegative,
          clip: ['4', 1],
        },
        class_type: 'CLIPTextEncode',
      },
      '8': {
        inputs: {
          samples: ['3', 0],
          vae: ['4', 2],
        },
        class_type: 'VAEDecode',
      },
      '9': {
        inputs: {
          filename_prefix: 'kineo_manga',
          images: ['8', 0],
        },
        class_type: 'SaveImage',
      },
    };

    try {
      logger.info(`[LocalDiffusionBridge] 提交 ComfyUI 工作流任务: "${fullPositivePrompt.slice(0, 45)}..."`);
      const promptRes = await fetch(`${endpoint}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: comfyGraph }),
      });

      if (!promptRes.ok) {
        throw new Error(`ComfyUI 提交失败: HTTP ${promptRes.status}`);
      }

      const promptData = await promptRes.json();
      const promptId = promptData.prompt_id;
      if (!promptId) return null;

      // 轮询历史记录获取生成图片
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const historyRes = await fetch(`${endpoint}/history/${promptId}`);
        if (!historyRes.ok) continue;

        const historyData = await historyRes.json();
        const runData = historyData[promptId];
        if (runData && runData.outputs && runData.outputs['9']) {
          const images = runData.outputs['9'].images;
          if (images && images.length > 0) {
            const imgMeta = images[0];
            const viewUrl = `${endpoint}/view?filename=${encodeURIComponent(imgMeta.filename)}&subfolder=${encodeURIComponent(imgMeta.subfolder || '')}&type=${encodeURIComponent(imgMeta.type || 'output')}`;
            const imgRes = await fetch(viewUrl);
            const arrayBuffer = await imgRes.arrayBuffer();
            return new Uint8Array(arrayBuffer);
          }
        }
      }

      return null;
    } catch (err) {
      logger.warn('[LocalDiffusionBridge] ComfyUI 生图失败:', err);
      return null;
    }
  }
}
