import Kanko from '@/components/kanko/Kanko';
import InfoButton from '@/components/ui/info-button';
import { Separator } from '@/components/ui/separator';
import { ReminderForm } from './reminder-form';

export default function SettingsNotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-subhead">Reminders</h2>
            <InfoButton title="Reminders">
              <p>
                A morning check-in and an evening nudge that skips itself on
                this phone once you check in here.
              </p>
              <p>Nothing else is ever sent.</p>
            </InfoButton>
          </div>
        </div>
        <Kanko mood="sleepy" size={96} className="size-24 shrink-0" />
      </div>
      <Separator />
      <ReminderForm />
    </div>
  );
}
