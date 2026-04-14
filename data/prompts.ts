export type PromptItem = {
  id: string;
  title: string;
  category: string;
  model: string;
  tags: string[];
  description: string;
  prompt: string;
  usage_tips?: string;
  example_input?: string;
  example_output?: string;
  is_paid?: boolean;
  owner_id?: string;
  created_at?: string;
};