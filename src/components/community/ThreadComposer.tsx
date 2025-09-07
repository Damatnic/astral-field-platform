"use client";

import React from "react";

interface ThreadComposerProps {
  categorySlug?: string;
}

const ThreadComposer: React.FC<ThreadComposerProps> = () => {
  return (
    <div className="p-4 border rounded bg-white">
      <p className="text-gray-700">Thread composer coming soon.</p>
    </div>
  );
};

export default ThreadComposer;
