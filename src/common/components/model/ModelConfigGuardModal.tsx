import { AlertTriangle, Key, ArrowRight, Settings } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';

interface ModelConfigGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelConfigGuardModal: React.FC<ModelConfigGuardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="studio-card max-w-md w-full p-6 border-amber-500/30 shadow-2xl relative overflow-hidden bg-slate-900 text-slate-100 rounded-2xl">
        <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              未配置 AI 模型 API Key
            </h3>
            <p className="text-[11px] text-amber-400/90 font-medium">
              阻断提示：流程无法进入下一步
            </p>
          </div>
        </div>

        <div className="space-y-3 py-2">
          <div className="p-3.5 bg-amber-950/20 rounded-xl border border-amber-500/20 text-xs text-slate-300 leading-relaxed">
            <p className="mb-2">
              ⚠️ 检测到当前系统尚未配置任何有效的 AI 提供商 API Key（如 DeepSeek, OpenAI, 智谱,
              百度等）。
            </p>
            <p className="text-slate-400">
              为防止执行 6 阶 SOP 拆解、角色一致性绑定与 TTS 混音时发生崩溃死锁，请先前往
              <strong className="text-amber-300">「设置中心」</strong> 配置至少一个模型 Key。
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400">
            <Key className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Key 将使用系统 Keyring 依赖项进行安全加密存储。</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-slate-800">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-xl"
          >
            稍后再说
          </Button>
          <Button
            onClick={() => {
              onClose();
              void navigate('/settings');
            }}
            className="bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-900/30 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            前往配置 Key
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModelConfigGuardModal;
