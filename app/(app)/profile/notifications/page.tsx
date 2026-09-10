import { Separator } from '@/components/ui/separator';
import { ReminderForm } from './reminder-form';

export default function SettingsNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-subhead">Reminders</h2>
        <p className="text-sm text-muted-foreground">
          A daily nudge to log your sores. Nothing else is ever sent.
        </p>
      </div>
      <Separator />
      <ReminderForm />
    </div>
  );
}
