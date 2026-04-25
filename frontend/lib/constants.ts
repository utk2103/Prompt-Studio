import type { Model, WizardQuestion } from './types';

export const FB_MODELS: Model[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', context: 128000, cost_in: 5, cost_out: 15, format: 'ChatML' },
  { id: 'claude-3-5', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', context: 200000, cost_in: 3, cost_out: 15, format: 'XML Tags' },
  { id: 'gemini-15', name: 'Gemini 1.5 Pro', provider: 'Google', context: 1000000, cost_in: 1.25, cost_out: 5, format: 'Gemini Native' },
  { id: 'gpt-35', name: 'GPT-3.5 Turbo', provider: 'OpenAI', context: 16385, cost_in: 0.5, cost_out: 1.5, format: 'ChatML' },
  { id: 'llama3', name: 'Llama 3.1 70B', provider: 'Meta', context: 128000, cost_in: 0.9, cost_out: 0.9, format: 'Llama Template' },
  { id: 'mistral', name: 'Mistral Large', provider: 'Mistral AI', context: 32000, cost_in: 4, cost_out: 12, format: 'Mistral Native' },
  { id: 'deepseek', name: 'DeepSeek-V3', provider: 'DeepSeek', context: 64000, cost_in: 0.27, cost_out: 1.1, format: 'ChatML' },
];

export const FB_WQ: WizardQuestion[] = [
  {
    id: 'goal',
    q: 'What is the PRIMARY objective of this prompt?',
    opts: ['Generate creative content', 'Analyze & evaluate data', 'Answer technical questions', 'Write/debug code', 'Summarize information', 'Transform/convert content', 'Extract structured data', 'Build a system persona'],
  },
  {
    id: 'audience',
    q: 'Who is the TARGET AUDIENCE for the output?',
    opts: ['General public', 'Software developers', 'Business executives', 'Researchers/academics', 'Students/beginners', 'Domain experts', 'Internal team use'],
  },
  {
    id: 'output_format',
    q: 'What OUTPUT FORMAT is required?',
    opts: ['Free-form prose', 'Bullet points / list', 'JSON / structured data', 'Markdown with headers', 'Code block', 'Step-by-step numbered', 'Table format', 'Hybrid (prose + structured)'],
  },
  {
    id: 'tone',
    q: 'What TONE should the response have?',
    opts: ['Professional / formal', 'Casual / conversational', 'Academic / scholarly', 'Creative / expressive', 'Concise / minimal', 'Instructional / didactic'],
  },
  {
    id: 'constraints',
    q: 'Are there KEY CONSTRAINTS to enforce?',
    opts: ['Word/character limit', 'Avoid specific topics', 'Must cite sources', 'Stay in domain only', 'Language restrictions', 'Safety/content filters', 'No constraints needed'],
  },
  {
    id: 'context_depth',
    q: 'How much CONTEXT should the prompt carry?',
    opts: ['Minimal – just the task', 'Some background context', 'Full domain background', 'Few-shot examples only', 'Chain-of-thought reasoning', 'Background + examples'],
  },
  {
    id: 'examples',
    q: 'Should the prompt include EXAMPLES?',
    opts: ['Yes – 1-2 examples', 'Yes – 3+ examples (few-shot)', 'Negative examples only', 'Input/output pair examples', 'No examples needed'],
  },
];

export const API = 'http://localhost:8000';
