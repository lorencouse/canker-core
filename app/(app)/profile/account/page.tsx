import { Separator } from '@/components/ui/separator';
import { AccountForm } from './account-form';

export default function SettingsAccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-subhead">Account</h2>
        <p className="text-sm text-muted-foreground">
          Update your account settings. Set your preferred language and
          timezone.
        </p>
      </div>
      <Separator />
      <AccountForm />
    </div>
  );
}
