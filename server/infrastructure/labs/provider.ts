import { ENV } from "../../config/env";
import { externalServiceError } from "../../core/errors";

export type LabProvisionRequest = {
  instanceId: string;
  templateSlug: string;
  userId: number;
  cpuLimit: number;
  memoryMb: number;
  diskMb: number;
  pidLimit: number;
  ttlSeconds: number;
  exposedPorts: number[];
};

export type LabProvisionResult = {
  targetUrl: string;
  containerRef?: string;
};

export interface LabProvider {
  provision(input: LabProvisionRequest): Promise<LabProvisionResult>;
  destroy(instanceId: string): Promise<void>;
}

class HttpLabProvider implements LabProvider {
  private configured() {
    return Boolean(ENV.LAB_MANAGER_URL && ENV.LAB_MANAGER_TOKEN);
  }

  async provision(input: LabProvisionRequest) {
    if (!this.configured()) throw externalServiceError("Isolated lab manager is not configured");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(`${ENV.LAB_MANAGER_URL!.replace(/\/$/, "")}/v1/instances`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.LAB_MANAGER_TOKEN}`,
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      if (!response.ok) throw externalServiceError(`Lab manager returned ${response.status}`);
      const payload = await response.json() as { targetUrl?: string; containerRef?: string };
      if (!payload.targetUrl) throw externalServiceError("Lab manager returned no target URL");
      return { targetUrl: payload.targetUrl, containerRef: payload.containerRef };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw externalServiceError("Lab manager timed out", error);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async destroy(instanceId: string) {
    if (!this.configured()) return;
    const response = await fetch(`${ENV.LAB_MANAGER_URL!.replace(/\/$/, "")}/v1/instances/${encodeURIComponent(instanceId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ENV.LAB_MANAGER_TOKEN}` },
    });
    if (!response.ok && response.status !== 404) throw externalServiceError(`Lab manager destroy returned ${response.status}`);
  }
}

export const labProvider: LabProvider = new HttpLabProvider();
