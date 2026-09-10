import { Separator } from '@/components/ui/separator';
import { AppearanceForm } from './appearance-form';

export default function SettingsAppearancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-subhead">Appearance</h2>
        <p className="text-sm text-muted-foreground">
          Choose a light or dark theme, or follow your device.
        </p>
      </div>
      <Separator />
      <AppearanceForm />
    </div>
  );
}
