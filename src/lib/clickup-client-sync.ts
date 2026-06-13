import type { SupabaseClient, User } from "@supabase/supabase-js";

export const CLICKUP_CLIENT_HEALTH_TRACKER_LIST_ID = "901105243881";

type ClickUpCustomFieldOption = {
  id?: string | number;
  name?: string;
  orderindex?: string | number;
};

type ClickUpCustomField = {
  name?: string;
  type?: string;
  value?: unknown;
  type_config?: {
    options?: ClickUpCustomFieldOption[];
  };
};

export type ClickUpTask = {
  id: string;
  name: string;
  status?: { status?: string };
  assignees?: Array<{ email?: string }>;
  list?: { id?: string | number };
  custom_fields?: ClickUpCustomField[];
};

type ClickUpListTasksResponse = {
  tasks?: ClickUpTask[];
  last_page?: boolean;
};

type UserLike = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type FirstNameUserMap = {
  byFirstName: Map<string, string>;
  ambiguousFirstNames: Set<string>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function trimToString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionLabel(
  options: ClickUpCustomFieldOption[] | undefined,
  rawValue: string | number | null
) {
  if (!options || rawValue == null) return null;

  const raw = String(rawValue);
  const match = options.find((option) => {
    const optionId = option.id == null ? null : String(option.id);
    const orderIndex = option.orderindex == null ? null : String(option.orderindex);
    return optionId === raw || orderIndex === raw;
  });

  return match?.name?.trim() || null;
}

function flattenFieldValue(value: unknown, options?: ClickUpCustomFieldOption[]): string[] {
  if (value == null) return [];

  if (typeof value === "string") {
    const optionLabel = getOptionLabel(options, value);
    if (optionLabel) {
      return [optionLabel];
    }

    return value.trim() ? [value.trim()] : [];
  }

  if (typeof value === "number") {
    const optionLabel = getOptionLabel(options, value);
    return optionLabel ? [optionLabel] : [String(value)];
  }

  if (typeof value === "boolean") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenFieldValue(entry, options));
  }

  if (typeof value === "object") {
    const entry = value as Record<string, unknown>;

    const optionLabel = getOptionLabel(options, typeof entry.id === "string" || typeof entry.id === "number" ? entry.id : null);
    if (optionLabel) {
      return [optionLabel];
    }

    const directFields = [entry.name, entry.username, entry.email, entry.label, entry.text];
    for (const directField of directFields) {
      const text = trimToString(directField);
      if (text) return [text];
    }

    if ("value" in entry) {
      return flattenFieldValue(entry.value, options);
    }

    return [];
  }

  return [];
}

export function buildClientSlug(name: string, taskId: string) {
  const base = slugify(name) || "client";
  return `${base}-${taskId.slice(0, 8)}`;
}

export function normalizeStatus(raw?: string) {
  const value = (raw ?? "").toLowerCase();
  if (value.includes("pause")) return "paused";
  if (value.includes("cancel")) return "canceled";
  return "active";
}

export function normalizeFirstName(value: string | null | undefined) {
  if (!value) return null;

  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();

  if (!normalized) return null;

  const [firstToken] = normalized.split(/\s+/);
  return firstToken || null;
}

export function getUserFirstName(user: UserLike) {
  const metadata = user.user_metadata ?? {};
  const directValues = [
    metadata.first_name,
    metadata.given_name,
    metadata.display_name,
    metadata.full_name,
    metadata.name,
  ];

  for (const rawValue of directValues) {
    const text = trimToString(rawValue);
    const normalized = normalizeFirstName(text);
    if (normalized) return normalized;
  }

  const email = trimToString(user.email);
  if (!email) return null;

  const localPart = email.split("@")[0] ?? "";
  return normalizeFirstName(localPart);
}

export function extractAccountManagerName(task: ClickUpTask) {
  const accountManagerField = task.custom_fields?.find(
    (field) => field.name?.trim().toLowerCase() === "account manager"
  );

  if (!accountManagerField) return null;

  const values = flattenFieldValue(accountManagerField.value, accountManagerField.type_config?.options);
  return values.find(Boolean) ?? null;
}

export async function fetchAllClickUpListTasks(accessToken: string, listId: string) {
  const tasks: ClickUpTask[] = [];

  for (let page = 0; page < 500; page += 1) {
    const query = new URLSearchParams({
      archived: "false",
      include_closed: "true",
      custom_fields: "true",
      page: String(page),
    });

    const response = await fetch(`https://api.clickup.com/api/v2/list/${encodeURIComponent(listId)}/task?${query}`, {
      headers: { Authorization: accessToken },
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ClickUp tasks fetch failed (${response.status}): ${text}`);
    }

    const json = (await response.json()) as ClickUpListTasksResponse;
    const pageTasks = json.tasks ?? [];
    tasks.push(...pageTasks);

    if (json.last_page === true || pageTasks.length === 0) {
      break;
    }
  }

  return tasks;
}

export async function buildTenantFirstNameUserMap(admin: SupabaseClient, tenantId: string): Promise<FirstNameUserMap> {
  const { data: memberships, error: membershipsError } = await admin
    .from("tenant_memberships")
    .select("user_id")
    .eq("tenant_id", tenantId);

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  const memberIds = new Set((memberships ?? []).map((membership) => membership.user_id as string));
  if (memberIds.size === 0) {
    return { byFirstName: new Map(), ambiguousFirstNames: new Set() };
  }

  const { data: profiles, error: profilesError } = await admin
    .from("user_profiles")
    .select("id, email")
    .in("id", [...memberIds]);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const fallbackEmailByUserId = new Map(
    (profiles ?? []).map((profile) => [String(profile.id), String(profile.email ?? "")])
  );

  const authUsersById = new Map<string, User>();
  for (let page = 1; page < 500 && authUsersById.size < memberIds.size; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(error.message);
    }

    const users = data.users ?? [];
    for (const user of users) {
      if (memberIds.has(user.id)) {
        authUsersById.set(user.id, user);
      }
    }

    if (users.length < 200) {
      break;
    }
  }

  const byFirstName = new Map<string, string>();
  const ambiguousFirstNames = new Set<string>();

  for (const userId of memberIds) {
    const authUser = authUsersById.get(userId);
    const firstName = getUserFirstName({
      email: authUser?.email ?? fallbackEmailByUserId.get(userId) ?? null,
      user_metadata: authUser?.user_metadata ?? null,
    });

    if (!firstName) continue;

    if (ambiguousFirstNames.has(firstName)) {
      continue;
    }

    const existingUserId = byFirstName.get(firstName);
    if (existingUserId && existingUserId !== userId) {
      byFirstName.delete(firstName);
      ambiguousFirstNames.add(firstName);
      continue;
    }

    byFirstName.set(firstName, userId);
  }

  return { byFirstName, ambiguousFirstNames };
}
