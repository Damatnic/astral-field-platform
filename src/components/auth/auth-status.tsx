'use client';

import { useUser } from "@stackframe/stack";

export default function AuthStatus() {
  const user = useUser();
  
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">Authentication Status</h3>
      {user ? (
        <div>
          <p className="text-green-600">✓ Signed in</p>
          <p>Email: {user.primaryEmail}</p>
          <p>ID: {user.id}</p>
        </div>
      ) : (
        <p className="text-gray-500">Not signed in</p>
      )}
    </div>
  );
}