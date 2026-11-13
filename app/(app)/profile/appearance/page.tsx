import InfoButton from '@/components/ui/info-button';
import { Separator } from '@/components/ui/separator';
import { AppearanceForm } from './appearance-form';

export default function SettingsAppearancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-subhead">Appearance</h2>
        <InfoButton title="Appearance">
          <p>Choose a light or dark theme, or follow your device.</p>
        </InfoButton>
      </div>
      <Separator />
      <AppearanceForm />
    </div>
  );
}
