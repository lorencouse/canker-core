import { createRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { FACTOR_KIND_LABELS, profileUpdateSchema } from '@canker/core';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Switch
} from '@canker/ui';
import { authedRoute } from '@/router-base';
import { useAuth, useUser } from '@/lib/auth';
import {
  useArchiveFactor,
  useDataset,
  useDeleteAllData,
  useProfile,
  useUpdateProfile
} from '@/lib/data';
import { useTheme, type ThemeSetting } from '@/lib/theme';
import { env } from '@/lib/env';
import { PageHeader } from '@/components/page-header';
import { ConfirmButton } from '@/components/confirm-button';

export const settingsRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/settings',
  component: SettingsPage
});

function timezones(): string[] {
  try {
    return (
      (
        Intl as unknown as { supportedValuesOf?: (k: string) => string[] }
      ).supportedValuesOf?.('timeZone') ?? []
    );
  } catch {
    return [];
  }
}

function SettingsPage() {
  const user = useUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const profile = useProfile();
  const dataset = useDataset();
  const update = useUpdateProfile();
  const archive = useArchiveFactor();
  const wipe = useDeleteAllData();
  const theme = useTheme();
  const zones = useMemo(timezones, []);
  const [exporting, setExporting] = useState(false);

  const p = profile.data;

  function save(patch: Record<string, unknown>) {
    const parsed = profileUpdateSchema.safeParse(patch);
    if (parsed.success) update.mutate(parsed.data);
  }

  async function exportJson() {
    if (!dataset.data) return;
    setExporting(true);
    try {
      const blob = new Blob(
        [
          JSON.stringify(
            { exported_at: new Date().toISOString(), profile: p, ...dataset.data },
            null,
            2
          )
        ],
        {
          type: 'application/json'
        }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canker-core-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const custom = (dataset.data?.factors ?? []).filter((f) => !f.is_preset);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" subtitle={user.email ?? undefined} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              defaultValue={p?.full_name ?? ''}
              onBlur={(e) => save({ full_name: e.target.value.trim() || null })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tz">Timezone</Label>
            <select
              id="tz"
              className="border-input bg-card h-10 rounded-md border px-3 text-sm"
              value={p?.timezone ?? 'UTC'}
              onChange={(e) => save({ timezone: e.target.value })}
            >
              {(zones.length ? zones : [p?.timezone ?? 'UTC']).map((z) => (
                <option key={z} value={z}>
                  {z.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground text-xs">
              Decides when "today" rolls over and when your reminder fires.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daily reminder</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="reminder-on">Remind me to check in</Label>
            <Switch
              id="reminder-on"
              checked={p?.reminder_enabled ?? true}
              onCheckedChange={(v) => save({ reminder_enabled: v })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reminder-at">Time</Label>
            <Input
              id="reminder-at"
              type="time"
              defaultValue={p?.reminder_at?.slice(0, 5) ?? '20:30'}
              onBlur={(e) => save({ reminder_at: e.target.value || null })}
              className="max-w-40"
            />
            <p className="text-muted-foreground text-xs">
              {env.isNative
                ? 'Delivered as a notification on this device.'
                : 'Reminders arrive as notifications in the mobile app. On the web, this saves your preference.'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            role="radiogroup"
            aria-label="Theme"
            className="bg-muted grid grid-cols-3 rounded-lg p-1 text-sm"
          >
            {(['light', 'system', 'dark'] as ThemeSetting[]).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={theme.setting === t}
                onClick={() => theme.setSetting(t)}
                className={`rounded-md px-2 py-1.5 font-medium capitalize ${theme.setting === t ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your factors</CardTitle>
          <p className="text-muted-foreground text-xs">
            Factors you added yourself. Archived ones stop appearing on Today but keep
            their history.
          </p>
        </CardHeader>
        <CardContent>
          {custom.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              You haven't added any yet. Use "+ Add" on Today.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {custom.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <div>
                    <p
                      className={
                        f.archived_at
                          ? 'text-muted-foreground line-through'
                          : 'font-medium'
                      }
                    >
                      {f.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {FACTOR_KIND_LABELS[f.kind]}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      archive.mutate({ factorId: f.id, archived: !f.archived_at })
                    }
                  >
                    {f.archived_at ? 'Restore' : 'Archive'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Export everything</p>
              <p className="text-muted-foreground text-xs">
                A JSON file of every sore, check-in, day and factor.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={exporting || !dataset.data}
              onClick={() => void exportJson()}
            >
              Export
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Delete all my data</p>
              <p className="text-muted-foreground text-xs">
                Removes every record. Your account stays so you can start again.
              </p>
            </div>
            <ConfirmButton
              variant="destructive"
              size="sm"
              confirmLabel="Really delete?"
              onConfirm={() => wipe.mutate()}
            >
              Delete
            </ConfirmButton>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={() => {
          void signOut().then(() => navigate({ to: '/login', search: {} }));
        }}
      >
        Sign out
      </Button>

      <p className="text-muted-foreground pb-4 text-center text-xs">
        Canker Core keeps records. It does not diagnose or treat anything.
      </p>
    </div>
  );
}
