export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabasePublicEnv() {
  return {
    url: getRequiredEnv("SUPABASE_URL"),
    publicKey: getRequiredEnv("SUPABASE_PUBLIC_KEY"),
  };
}

export function getSupabaseServiceEnv() {
  return {
    url: getRequiredEnv("SUPABASE_URL"),
    secretKey: getRequiredEnv("SUPABASE_SECRET_KEY"),
  };
}

export function getAppBaseUrl() {
  return getRequiredEnv("NEXT_PUBLIC_APP_BASE_URL").replace(/\/$/, "");
}

export function getCronSecret() {
  return process.env.CRON_SECRET ?? process.env.APP_CRON_SECRET ?? null;
}

export function getOpenAIConfig() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return {
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORGANIZATION ?? undefined,
    project: process.env.OPENAI_API_PROJECT ?? undefined,
    model: process.env.OPENAI_MODEL ?? "gpt-5.2",
  };
}

