import { EpisodeManagerService } from '@/core/services/episode/EpisodeManagerService';

describe('EpisodeManagerService — 长篇网文多集连载与短剧黄金3秒/尾镜悬念引擎', () => {
  it('应成功将长篇小说文本切分为多集连载架构', () => {
    const novelText = `
夜幕降临，暴雨倾盆。林澈手握长剑，剑锋寒光凛冽！
“苏晴，退后！他们要动手了！”林澈厉声喝道。
四周黑衣杀手悄然逼近，刀剑出鞘之声撕裂雨夜。
林澈身形暴起，一剑斩出，雷光激荡！
“轰——！”天际巨雷炸响，照亮了杀手狰狞的面孔。
林澈与杀手首领激烈对峙，火星四溅。
苏晴从怀中掏出神秘芯片：“数据核心还在，决不能让他们抢走！”
杀手首领冷笑：“你们走不掉的，整个街区已被天网封锁。”
林澈冷哼一声：“那就杀出一条血路！”
剑气纵横，林澈连续击退三名杀手。
然而，就在此时，街角警报大作。
数十架赛博战甲从天而降，重重包围！
林澈喘息着护住苏晴，已然退无可退。
“难道……真的要命悬一线了吗？”林澈眼神坚毅，准备殊死一搏。

第二幕：转机再起。废弃工厂深处，全息投影突然亮起。
苏晴惊呼：“这难道是父亲当年留下的终极AI矩阵？”
系统提示音骤然响起：“神级算力已连接，基因锁解锁100%！”
林澈只觉周身力量疯狂攀升，伤口瞬间愈合。
“怎么可能……这是神级觉醒！”林澈看着双手。
黑衣首领面色惨变：“不好，快阻止他！”
林澈冷冷抬眼，嘴角勾起一抹冰冷笑意：“现在，该算算我们的账了！”
`;

    const series = EpisodeManagerService.splitNovelIntoEpisodes('逆命修罗·天网重围', novelText, {
      scenesPerEpisode: 10,
      targetDurationPerEpisode: 60,
    });

    expect(series).toBeDefined();
    expect(series.title).toBe('逆命修罗·天网重围');
    expect(series.episodes.length).toBeGreaterThanOrEqual(2);

    const ep1 = series.episodes[0];
    expect(ep1.episodeNumber).toBe(1);
    expect(ep1.scenes.length).toBe(10);
    expect(ep1.hookCue).toBeDefined();
    // 首集有激烈搏杀与拔剑，应识别为冲突钩子
    expect(['conflict_clash', 'visual_shock']).toContain(ep1.hookCue?.type);
    expect(ep1.cliffhangerCue).toBeDefined();
    expect(ep1.pacingCurve.length).toBe(10);
    expect(ep1.pacingCurve[0].pacingTag).toBe('hook');
    expect(ep1.pacingCurve[ep1.pacingCurve.length - 1].pacingTag).toBe('cliffhanger');

    const ep2 = series.episodes[1];
    expect(ep2.episodeNumber).toBe(2);
    expect(ep2.scenes.length).toBeGreaterThan(0);
  });

  it('应准确探测黄金 3 秒悬疑质问钩子 (Suspense Question)', () => {
    const scenes = [
      {
        id: 's_hook',
        chapterId: 'c1',
        sceneNumber: 1,
        content: '为什么整个基地的警报全都失灵了？难道我们中出了叛徒？',
        startPosition: 0,
        endPosition: 20,
        characters: ['侦探'],
        dialogues: [],
        emotions: [],
      },
    ];

    const cue = EpisodeManagerService.analyzeGolden3Seconds(scenes as any);
    expect(cue.type).toBe('suspense_question');
    expect(cue.intensity).toBeGreaterThanOrEqual(0.85);
  });

  it('应准确探测生死危机卡点 (Life Death Cliffhanger)', () => {
    const scenes = [
      {
        id: 's_end',
        chapterId: 'c1',
        sceneNumber: 12,
        content: '利刃已刺入心口，主角重重倒下，命悬一线……',
        startPosition: 0,
        endPosition: 20,
        characters: ['主角'],
        dialogues: [],
        emotions: [],
      },
    ];

    const cliffhanger = EpisodeManagerService.analyzeCliffhanger(scenes as any);
    expect(cliffhanger.type).toBe('life_death');
    expect(cliffhanger.retentionScore).toBeGreaterThanOrEqual(0.9);
  });
});
