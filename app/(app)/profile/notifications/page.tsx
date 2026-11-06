import Kanko from '@/components/kanko/Kanko';
import { Separator } from '@/components/ui/separator';
import { ReminderForm } from './reminder-form';

export default function SettingsNotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-subhead">Reminders</h2>
          <p className="text-sm text-muted-foreground">
            A daily nudge to log your sores, best in the evening. Nothing else
            is ever sent.
          </p>
        </div>
        <Kanko mood="sleepy" size={96} className="size-24 shrink-0" />
      </div>
      <Separator />
      <ReminderForm />
    </div>
  );
}
