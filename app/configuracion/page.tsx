"use client";
import ConfigPanel from './ConfigPanel';
import AssistantBubble from '../components/AsisstantIA/AssistantBubble';

const ConfiguracionPage = () => {
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
