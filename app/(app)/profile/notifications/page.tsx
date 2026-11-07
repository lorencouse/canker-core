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
            A morning check-in and an evening nudge that skips itself on this
            phone once you check in here. Nothing else is ever sent.
          </p>
        </div>
        <Kanko mood="sleepy" size={96} className="size-24 shrink-0" />
      </div>
      <Separator />
      <ReminderForm />
    </div>
  );
}
