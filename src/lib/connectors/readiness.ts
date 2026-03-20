import { env } from "@/lib/env";
import type { ConnectorProviderKey } from "@/lib/connectors/types";

type Requirement = {
  key: string;
  isSet: boolean;
};

export type ProviderReadiness = {
  provider: ConnectorProviderKey;
  configured: boolean;
  requirements: Requirement[];
  notes: string[];
};

function req(key: string, value?: string): Requirement {
  return { key, isSet: Boolean(value && value.trim().length > 0) };
}

export function getConnectorReadiness(): ProviderReadiness[] {
  const result: ProviderReadiness[] = [];

  const abnRequirements = [req("ABN_AMRO_CLIENT_ID", env.ABN_AMRO_CLIENT_ID), req("ABN_AMRO_CLIENT_SECRET", env.ABN_AMRO_CLIENT_SECRET)];
  result.push({
    provider: "ABN_AMRO",
    configured: abnRequirements.every((item) => item.isSet),
    requirements: abnRequirements,
    notes: ["Requires ABN developer onboarding and approved redirect URI."],
  });

  const icsRequirements = [
    req("ICS_CLIENT_ID", env.ICS_CLIENT_ID),
    req("ICS_CLIENT_SECRET", env.ICS_CLIENT_SECRET),
    req("ICS_AUTH_URL", env.ICS_AUTH_URL),
    req("ICS_TOKEN_URL", env.ICS_TOKEN_URL),
    req("ICS_API_BASE_URL", env.ICS_API_BASE_URL),
  ];
  result.push({
    provider: "ICS",
    configured: icsRequirements.every((item) => item.isSet),
    requirements: icsRequirements,
    notes: ["Requires ICS API contract and production app registration."],
  });

  const paypalRequirements = [req("PAYPAL_CLIENT_ID", env.PAYPAL_CLIENT_ID), req("PAYPAL_CLIENT_SECRET", env.PAYPAL_CLIENT_SECRET)];
  result.push({
    provider: "PAYPAL",
    configured: paypalRequirements.every((item) => item.isSet),
    requirements: paypalRequirements,
    notes: ["Use PayPal live credentials for production."],
  });

  const bitvavoRequirements = [req("BITVAVO_API_KEY", env.BITVAVO_API_KEY), req("BITVAVO_API_SECRET", env.BITVAVO_API_SECRET)];
  result.push({
    provider: "BITVAVO",
    configured: bitvavoRequirements.every((item) => item.isSet),
    requirements: bitvavoRequirements,
    notes: ["Ensure API key has read permissions for account history."],
  });

  result.push({
    provider: "MANUAL",
    configured: true,
    requirements: [],
    notes: ["Always available as fallback."],
  });
  result.push({
    provider: "MOCK",
    configured: true,
    requirements: [],
    notes: ["Development fallback adapter."],
  });

  return result;
}

export function getCoreReadiness() {
  const checks = [
    req("DATABASE_URL", env.DATABASE_URL),
    req("NEXTAUTH_SECRET", env.NEXTAUTH_SECRET),
    req("CONNECTOR_REDIRECT_BASE_URL", env.CONNECTOR_REDIRECT_BASE_URL),
    req("ENCRYPTION_KEY", env.ENCRYPTION_KEY),
  ];
  return {
    configured: checks.every((item) => item.isSet),
    checks,
  };
}
