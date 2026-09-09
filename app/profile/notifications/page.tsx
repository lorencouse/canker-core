import { Separator } from '@/components/ui/separator';
import { NotificationsForm } from './notifications-form';

export default function SettingsNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-subhead">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Configure how you receive notifications.
        </p>
      </div>
      <Separator />
      <NotificationsForm />
    </div>
  );
}
