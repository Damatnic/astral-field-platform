"use client";

import React from "react";

interface ForumListProps {
  className?, string,
  showCategories?, boolean,
  showRecentThreads?, boolean,
  categorySlug?, string,
  
}
const ForumList: React.FC<ForumListProps> = () => { return (
    <div className="p-4 border rounded bg-white">
      <p className="text-gray-700">Community forums coming soon.</p>
    </div>
  );
 }
export default ForumList;
