/**
 * Test explainer parameter mapping and validation
 */

import { getManimQualityFlag, getManimResolution } from '../lib/modal/setup';
import { validateGeneratedCode } from '../lib/manim/static-validator';

describe('Explainer Parameter Mapping', () => {
  describe('getManimQualityFlag', () => {
    test('should map resolution to correct quality flags', () => {
      expect(getManimQualityFlag('480p')).toBe('-ql');
      expect(getManimQualityFlag('720p')).toBe('-qh');
      expect(getManimQualityFlag('1080p')).toBe('-qk');
      expect(getManimQualityFlag('unknown')).toBe('-qh'); // default
    });
  });

  describe('getManimResolution', () => {
    test('should calculate correct dimensions for 16:9 aspect ratio', () => {
      expect(getManimResolution('16:9', '720p')).toBe('1280x720');
      expect(getManimResolution('16:9', '1080p')).toBe('1920x1080');
      expect(getManimResolution('16:9', '480p')).toBe('854x480');
    });

    test('should calculate correct dimensions for 9:16 aspect ratio', () => {
      expect(getManimResolution('9:16', '720p')).toBe('405x720');
      expect(getManimResolution('9:16', '1080p')).toBe('608x1080');
      expect(getManimResolution('9:16', '480p')).toBe('270x480');
    });

    test('should calculate correct dimensions for 1:1 aspect ratio', () => {
      expect(getManimResolution('1:1', '720p')).toBe('720x720');
      expect(getManimResolution('1:1', '1080p')).toBe('1080x1080');
      expect(getManimResolution('1:1', '480p')).toBe('480x480');
    });

    test('should default to 16:9 for unknown aspect ratio', () => {
      expect(getManimResolution('unknown', '720p')).toBe('1280x720');
    });
  });
});

describe('Voice Validation', () => {
  test('should validate correct voice usage', () => {
    const codeWithCorrectVoice = `
from manim import *
from manim_voiceover.services.openai import OpenAIService

class TestScene(VoiceoverScene):
    def construct(self):
        self.set_speech_service(OpenAIService(voice="fable", model="gpt-4o-mini-tts", transcription_model=None))
        with self.voiceover(text="Hello world") as tracker:
            self.play(Write(Text("Hello")))
`;

    const issues = validateGeneratedCode(codeWithCorrectVoice, 'fable');
    const voiceIssues = issues.filter(issue => issue.pattern === 'wrong voice' || issue.pattern === 'missing voice');
    expect(voiceIssues).toHaveLength(0);
  });

  test('should detect wrong voice usage', () => {
    const codeWithWrongVoice = `
from manim import *
from manim_voiceover.services.openai import OpenAIService

class TestScene(VoiceoverScene):
    def construct(self):
        self.set_speech_service(OpenAIService(voice="alloy", model="gpt-4o-mini-tts", transcription_model=None))
        with self.voiceover(text="Hello world") as tracker:
            self.play(Write(Text("Hello")))
`;

    const issues = validateGeneratedCode(codeWithWrongVoice, 'fable');
    const voiceIssues = issues.filter(issue => issue.pattern === 'wrong voice');
    expect(voiceIssues).toHaveLength(1);
    expect(voiceIssues[0].issue).toContain('Expected voice "fable" but found "alloy"');
  });

  test('should detect missing voice parameter', () => {
    const codeWithoutVoice = `
from manim import *
from manim_voiceover.services.openai import OpenAIService

class TestScene(VoiceoverScene):
    def construct(self):
        self.set_speech_service(OpenAIService(model="gpt-4o-mini-tts", transcription_model=None))
        with self.voiceover(text="Hello world") as tracker:
            self.play(Write(Text("Hello")))
`;

    const issues = validateGeneratedCode(codeWithoutVoice, 'fable');
    const voiceIssues = issues.filter(issue => issue.pattern === 'missing voice');
    expect(voiceIssues).toHaveLength(1);
    expect(voiceIssues[0].issue).toContain('Expected voice "fable" but no voice parameter found');
  });
});

