import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Send,
} from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';

export interface AuditTicket {
  id: string;
  targetRole: 'writer' | 'storyboarder' | 'producer';
  targetRoleName: string;
  stageName: string;
  comment: string;
  author: string;
  createdAt: string;
  status: 'pending_fix' | 'fixed';
}

const DEFAULT_TICKETS: AuditTicket[] = [
  {
    id: 'ticket-1',
    targetRole: 'storyboarder',
    targetRoleName: '分镜师',
    stageName: 'Stage 3 · 分镜 4K 构建',
    comment:
      '第 2 镜林修的服装特写与 Stage 2 资产库中的青色风衣不一致，存在跑脸/跑服风险，请重新垫图生成。',
    author: '导演 / 质检员',
    createdAt: '2026-08-07 20:30',
    status: 'pending_fix',
  },
];

export interface AuditReviewPanelProps {
  currentStage?: any;
  activeRole?: any;
  auditHistory?: any[];
  onApprove?: (comment?: string) => void;
  onReject?: (comment?: string) => void;
  onRequestReview?: () => void;
}

export const AuditReviewPanel: React.FC<AuditReviewPanelProps> = ({
  onApprove: externalApprove,
  onReject: externalReject,
}) => {
  const [tickets, setTickets] = useState<AuditTicket[]>(DEFAULT_TICKETS);
  const [selectedRole, setSelectedRole] = useState<'writer' | 'storyboarder' | 'producer'>(
    'storyboarder'
  );
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = () => {
    if (typeof externalApprove === 'function') {
      externalApprove('终审合格');
    } else {
      toast.success('【导演终审通过】漫剧 4K 全流向阶段质检合格，已推进至完工导出！');
    }
  };

  const handleCreateRejectTicket = () => {
    if (!rejectComment.trim()) {
      toast.error('请输入具体打回修改意见说明！');
      return;
    }

    const roleNameMap = {
      writer: '编剧',
      storyboarder: '分镜师',
      producer: '制作师',
    };

    const newTicket: AuditTicket = {
      id: `ticket-${Date.now()}`,
      targetRole: selectedRole,
      targetRoleName: roleNameMap[selectedRole],
      stageName: 'Stage 3 · 角色与分镜审核',
      comment: rejectComment.trim(),
      author: '导演 / 质检员',
      createdAt: new Date().toLocaleTimeString(),
      status: 'pending_fix',
    };

    setTickets([newTicket, ...tickets]);
    if (typeof externalReject === 'function') {
      externalReject(rejectComment.trim());
    }
    setRejectComment('');
    setShowRejectForm(false);
    toast.warning(`已向【${roleNameMap[selectedRole]}】下发打回驳回批注工单！`);
  };

  const handleMarkFixed = (ticketId: string) => {
    setTickets(tickets.map((t) => (t.id === ticketId ? { ...t, status: 'fixed' as const } : t)));
    toast.success('该驳回工单已确认修复完成！');
  };

  return (
    <Card className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-5 rounded-2xl mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800/80 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/30 flex items-center justify-center text-[#a855f7] shadow-[0_0_16px_rgba(168,85,247,0.2)]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              4 角色导演质检与打回流转工单 (Audit Review System)
            </h3>
            <p className="text-xs text-slate-400">
              编剧 ➔ 分镜 ➔ 制作 ➔ 导演审核，支持精准打回并批注修正
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            className="bg-[#00f5d4] hover:bg-[#00f5d4]/80 text-slate-950 font-bold text-xs shadow-[0_0_12px_rgba(0,245,212,0.3)]"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            质检合格 · 终审通过
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRejectForm(!showRejectForm)}
            className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs"
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            打回驳回批注
          </Button>
        </div>
      </div>

      {/* 质检打回工单填写区 */}
      {showRejectForm && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/30 mb-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              新建质检打回批注工单
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">指派修复角色:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs"
              >
                <option value="writer">编剧 (剧本问题)</option>
                <option value="storyboarder">分镜师 (画风/跑脸问题)</option>
                <option value="producer">制作师 (音轨/画面剪辑问题)</option>
              </select>
            </div>
          </div>

          <Textarea
            rows={2}
            placeholder="详细描述具体修改建议（如：第 3 集镜头 2 人物青色风衣颜色偏差，需根据资产库修正...）"
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            className="bg-slate-900 border-slate-800 text-xs text-slate-100 resize-none"
          />

          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowRejectForm(false)}
              className="text-xs text-slate-400"
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleCreateRejectTicket}
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              下发打回工单
            </Button>
          </div>
        </div>
      )}

      {/* 工单列表 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>流转工单记录 ({tickets.length})</span>
          <span>待修复工单: {tickets.filter((t) => t.status === 'pending_fix').length} 项</span>
        </div>

        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className={`p-3.5 rounded-xl border flex items-start justify-between gap-4 transition-all ${
              ticket.status === 'pending_fix'
                ? 'bg-rose-950/20 border-rose-500/30'
                : 'bg-slate-950/40 border-slate-800 opacity-75'
            }`}
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    ticket.status === 'pending_fix'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px]'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]'
                  }
                >
                  {ticket.status === 'pending_fix' ? '待修复' : '已修复完成'}
                </Badge>
                <span className="font-bold text-xs text-slate-200">
                  指派 ➔ 【{ticket.targetRoleName}】
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{ticket.createdAt}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{ticket.comment}</p>
            </div>

            {ticket.status === 'pending_fix' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkFixed(ticket.id)}
                className="border-[#00f5d4]/40 text-[#00f5d4] hover:bg-[#00f5d4]/10 text-xs flex-shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                标记已修复
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AuditReviewPanel;
