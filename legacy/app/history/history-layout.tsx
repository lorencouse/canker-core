import React from 'react';
import { User, Sore } from '@/types';

import BarChartComponent from '@/components/charts/BarChartComponent';
import SoresTable from '@/components/charts/SoresTable';

const SoreHistoryLayout = ({ user, sores }: { user: User; sores: Sore[] }) => {
  return (
    <div className="max-w-6xl mx-auto mb-20">
      <h1 className="m-6 text-2xl font-bold">
        {user.full_name ? user.full_name : 'User'}'s Sore History
      </h1>
      {sores.length === 0 ? (
        <p>No sores found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-x-20 md:px-10 px-0">
          <BarChartComponent sores={sores} />
          <SoresTable sores={sores} />
        </div>
      )}
    </div>
  );
};

export default SoreHistoryLayout;
