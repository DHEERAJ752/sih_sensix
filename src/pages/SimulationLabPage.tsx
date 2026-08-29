import React from 'react';
import { PureHighwaySimulatorView } from '../components/simulation/PureHighwaySimulatorView';

export const SimulationLabPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PureHighwaySimulatorView />
    </div>
  );
};
