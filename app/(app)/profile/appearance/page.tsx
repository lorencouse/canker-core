import LargeTitle from '@/components/shell/LargeTitle';
import InfoButton from '@/components/ui/info-button';

import { BackToSettings } from '../components/grouped-list';
import { AppearanceForm } from './appearance-form';

export default function SettingsAppearancePage() {
  return (
    <>
      <BackToSettings />
      <LargeTitle
        className="mb-4"
        accessory={
          <InfoButton title="Appearance">
            <p>Choose a light or dark theme, or follow your device.</p>
            <p>Saved to this phone or browser.</p>
          </InfoButton>
        }
      >
        Appearance
      </LargeTitle>
      <AppearanceForm />
    </>
  );
}
