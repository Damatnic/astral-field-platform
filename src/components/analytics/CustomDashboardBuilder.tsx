"use client";

import React from "react";

const CustomDashboardBuilder: React.FC<{ dashboardId?: string }> = () => { return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Custom Dashboard Builder</h2>
      <div className="p-4 border rounded bg-white">
        <p className="text-gray-700">
          Drag-and-drop dashboard builder coming soon.
        </p>
      </div>
    </div>
  );
 }
export default CustomDashboardBuilder;
