import type React from 'react';

interface ZoneSelectorProps {
  onChange: (zone: string) => void;
  zone: string;
}

const ZoneSelector: React.FC<ZoneSelectorProps> = ({ onChange, zone }) => {
  return (
    <div className="zone-selector">
      <label>
        Zone:
        <select value={zone || ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select a Zone</option>
          <option value="Left Cheek">Left Cheek</option>
          <option value="Upper Mouth">Upper Mouth</option>
          <option value="Right Cheek">Right Cheek</option>
          <option value="Left Jaw">Left Jaw</option>
          <option value="Lower Mouth">Lower Mouth</option>
          <option value="Right Jaw">Right Jaw</option>
          <option value="mouthDiagramNoLabels">
            Mouth Diagram (No Labels)
          </option>
        </select>
      </label>
    </div>
  );
};

export default ZoneSelector;
