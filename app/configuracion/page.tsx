"use client";
import React from 'react';
import ConfigPanel from './ConfigPanel';
import AssistantBubble from '../components/AsisstantIA/AssistantBubble';

const ConfiguracionPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-primary text-white p-6">
      <div className="max-w-6xl mx-auto">
        <ConfigPanel />
      </div>
      <AssistantBubble />
    </div>
  );
};

export default ConfiguracionPage;
