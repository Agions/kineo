import { CharacterPortraitService } from '@/core/services/ai/character/CharacterPortraitService';
import type { Character } from '@/core/types';

describe('CharacterPortraitService — Visual DNA & Character Consistency', () => {
  const projectId = 'test-character-consistency-proj';

  const mockCharacter: Character = {
    id: 'char-lin-che',
    name: '林澈',
    role: 'protagonist',
    gender: 'male',
    hairColor: '银白色',
    hairStyle: '碎短发',
    eyeColor: '琥珀金',
    features: ['左眼机械义眼', '冷峻神情'],
    appearance: {
      clothing: '高领黑色战术风衣',
    },
  };

  it('deriveVisualDna should extract complete visual tags correctly', () => {
    const dna = CharacterPortraitService.deriveVisualDna(mockCharacter);
    expect(dna).toContain('男性');
    expect(dna).toContain('银白色碎短发');
    expect(dna).toContain('琥珀金瞳色');
    expect(dna).toContain('左眼机械义眼');
    expect(dna).toContain('冷峻神情');
    expect(dna).toContain('高领黑色战术风衣');
  });

  it('deriveVisualDna should provide role fallback when appearance is sparse', () => {
    const sparseChar: Character = {
      id: 'char-anonymous',
      name: '神秘人',
      role: 'antagonist',
    };
    const dna = CharacterPortraitService.deriveVisualDna(sparseChar);
    expect(dna.length).toBeGreaterThan(0);
    expect(dna).toContain('反派气质');
  });

  it('generatePortrait should generate stylized reference portrait asset and return local path', async () => {
    const result = await CharacterPortraitService.generatePortrait(projectId, mockCharacter);

    expect(result.uri).toBeDefined();
    expect(result.localDiskPath).toBeDefined();
    expect(result.visualDna).toEqual(expect.arrayContaining(['男性', '银白色碎短发']));
  });

  it('uploadPortrait should persist user provided image data', async () => {
    const fakeBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const uploadRes = await CharacterPortraitService.uploadPortrait(
      projectId,
      mockCharacter.id,
      fakeBase64
    );

    expect(uploadRes.uri).toBeDefined();
    expect(uploadRes.localDiskPath).toBeDefined();
  });
});
