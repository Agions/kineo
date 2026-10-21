/**
 * useRecording — 录音逻辑 Hook
 * 从 useAudioEditor 拆出，管理 MediaRecorder + 计时器
 */

import { useCallback, useRef } from 'react';

import { message } from '@/components/ui/message';
import type { VoiceTrack } from '@/common/types/audio';
import { formatTime } from '@/common/utils';

interface UseRecordingOptions {
  setRecordingTime: (updater: (prev: number) => number) => void;
  setIsRecording: (v: boolean) => void;
  setVoiceTracks: (updater: (prev: VoiceTrack[]) => VoiceTrack[]) => void;
}

export function useRecording({
  setRecordingTime,
  setIsRecording,
  setVoiceTracks,
}: UseRecordingOptions) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingTimeRef = useRef(0);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  }, [setIsRecording]);

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const fileName = `录音_${formatTime(recordingTimeRef.current)}`;

        setVoiceTracks((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: fileName,
            filePath: '',
            fileUrl: url,
            duration: recordingTimeRef.current,
            startTime: 0,
            volume: 80,
            fadeIn: 0,
            fadeOut: 0,
            type: 'voiceover' as const,
          },
        ]);
        message.success('录音完成');
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      recordingTimeRef.current = 0;
      setRecordingTime(() => 0);

      const timer = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(() => recordingTimeRef.current);
      }, 1000);
      recordingTimerRef.current = timer;
    } catch {
      message.error('无法访问麦克风，请检查权限设置');
    }
  }, [setIsRecording, setRecordingTime, setVoiceTracks]);

  return { handleStartRecording, handleStopRecording, mediaRecorderRef, recordingTimerRef };
}
