import Kanko from '@/components/kanko/Kanko';
import LargeTitle from '@/components/shell/LargeTitle';
import InfoButton from '@/components/ui/info-button';

import { BackToSettings } from '../components/grouped-list';
import { ReminderForm } from './reminder-form';

export default function SettingsNotificationsPage() {
  return (
    <>
      <BackToSettings />
      <div className="mb-4 flex items-center gap-3">
        <LargeTitle
          className="min-w-0 flex-1"
          accessory={
            <InfoButton title="Reminders">
              <p>
                A morning check-in and an evening nudge that skips itself on
                this phone once you check in here.
              </p>
              <p>Nothing else is ever sent.</p>
            </InfoButton>
          }
        >
          Reminders
        </LargeTitle>
        <Kanko mood="sleepy" size={72} className="size-[72px] shrink-0" />
      </div>
      <ReminderForm />
    </>
  );
}
