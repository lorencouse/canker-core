import React from 'react';
import { User, Sore } from '@/types';

import BarChartComponent from '@/components/charts/BarChartComponent';
import SoresTable from '@/components/charts/SoresTable';

const SoreHistoryLayout = ({ user, sores }: { user: User; sores: Sore[] }) => {
  return (
    <div>
      <h1 className="m-6 text-2xl font-bold">
        {user.full_name ? user.full_name : 'User'}'s Sore History
      </h1>
      {sores.length === 0 ? (
        <p>No sores found.</p>
      ) : (
        <div className="flex">
          <SoresTable sores={sores} />
          <BarChartComponent sores={sores} />
        </div>
      )}
    </div>
  );
};

export default SoreHistoryLayout;
