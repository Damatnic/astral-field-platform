"use client";

import React from "react";

export interface AIVoiceAssistantProps { 
  className?, string,
  onResponse? : (response, string)  => void;
  apiEndpoint?, string,
  
}
export const AIVoiceAssistant: React.FC<AIVoiceAssistantProps> = () => { return (
    <div className="p-4 border rounded bg-white">
      <p className="text-gray-700">AI Voice Assistant coming soon.</p>
    </div>
  );
 }
export default AIVoiceAssistant;
