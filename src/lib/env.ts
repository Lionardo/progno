export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getOptionalOpenAIBaseConfig() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return {
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORGANIZATION ?? undefined,
    project: process.env.OPENAI_API_PROJECT ?? undefined,
  };
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
  const base = getOptionalOpenAIBaseConfig();

  if (!base) {
    return null;
  }

  return {
    ...base,
    model: process.env.OPENAI_MODEL ?? "gpt-5.2",
  };
}

export function getOpenAIForecastModel() {
  return process.env.OPENAI_FORECAST_MODEL ?? "gpt-5.4-mini";
}

export function getOpenAIForecastConfig() {
  const base = getOptionalOpenAIBaseConfig();

  if (!base) {
    return null;
  }

  return {
    ...base,
    model: getOpenAIForecastModel(),
  };
}

export function getOpenAINewsModel() {
  return process.env.OPENAI_NEWS_MODEL ?? "gpt-5.4-mini";
}

export function getOpenAINewsConfig() {
  const base = getOptionalOpenAIBaseConfig();

  if (!base) {
    return null;
  }

  return {
    ...base,
    model: getOpenAINewsModel(),
  };
}
