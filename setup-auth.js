#!/usr/bin/env node

/**
 * Automated Neon Auth Setup Script
 * This script automatically configures Neon Auth for your Next.js application
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    step: `${colors.cyan}▸${colors.reset}`
  };
  console.log(`${prefix[type]} ${message}`);
}

function execCommand(command, description) {
  try {
    log(`${description}...`, 'step');
    execSync(command, { stdio: 'inherit' });
    log(`${description} completed`, 'success');
    return true;
  } catch (error) {
    log(`Failed: ${description}`, 'error');
    console.error(error.message);
    return false;
  }
}

async function setupAuth() {
  console.log(`\n${colors.bright}${colors.cyan}🚀 Starting Neon Auth Setup${colors.reset}\n`);

  // Step 1: Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    log('Please run this script from your project root directory', 'error');
    process.exit(1);
  }

  // Step 2: Install required packages
  log('Installing authentication packages...', 'info');
  const packages = [
    '@stackframe/stack',
    'server-only'
  ];
  
  if (!execCommand(`npm install ${packages.join(' ')}`, 'Installing packages')) {
    log('Failed to install packages. Please check your npm configuration.', 'error');
    process.exit(1);
  }

  // Step 3: Create stack.config.ts
  log('Creating Stack configuration...', 'info');
  const stackConfigContent = `import "server-only";
import { StackServerApp } from "@stackframe/stack";

const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY!,
  urls: {
    handler: "/handler",
    signIn: "/handler/sign-in",
    signUp: "/handler/sign-up",
    afterSignIn: "/",
    afterSignUp: "/",
    signOut: "/handler/sign-out",
    afterSignOut: "/",
  }
});

export default stackServerApp;`;

  fs.writeFileSync('stack.config.ts', stackConfigContent);
  log('Created stack.config.ts', 'success');

  // Step 4: Create provider component
  log('Creating authentication provider...', 'info');
  const providerDir = path.join('src', 'app', 'providers');
  if (!fs.existsSync(providerDir)) {
    fs.mkdirSync(providerDir, { recursive: true });
  }

  const providerContent = `'use client';

import { StackProvider, StackTheme, StackClientApp } from "@stackframe/stack";

const stackClientApp = new StackClientApp({
  tokenStore: "cookie",
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
  urls: {
    handler: "/handler",
    signIn: "/handler/sign-in",
    signUp: "/handler/sign-up",
    afterSignIn: "/",
    afterSignUp: "/",
    signOut: "/handler/sign-out",
    afterSignOut: "/",
  }
});

export default function StackAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider app={stackClientApp}>
      <StackTheme>
        {children}
      </StackTheme>
    </StackProvider>
  );
}`;

  fs.writeFileSync(path.join(providerDir, 'stack-provider.tsx'), providerContent);
  log('Created stack-provider.tsx', 'success');

  // Step 5: Create handler route
  log('Creating authentication handler...', 'info');
  const handlerDir = path.join('src', 'app', 'handler', '[...stack]');
  if (!fs.existsSync(handlerDir)) {
    fs.mkdirSync(handlerDir, { recursive: true });
  }

  const handlerContent = `import { StackHandler } from "@stackframe/stack";
import stackServerApp from "../../../../stack.config";

export default function Handler(props: { params: any, searchParams: any }) {
  return (
    <StackHandler
      app={stackServerApp}
      routeProps={props}
      fullPage={true}
    />
  );
}`;

  fs.writeFileSync(path.join(handlerDir, 'page.tsx'), handlerContent);
  log('Created handler route', 'success');

  // Step 6: Update layout.tsx
  log('Updating root layout...', 'info');
  const layoutPath = path.join('src', 'app', 'layout.tsx');
  
  if (fs.existsSync(layoutPath)) {
    let layoutContent = fs.readFileSync(layoutPath, 'utf8');
    
    // Add import if not present
    if (!layoutContent.includes('stack-provider')) {
      const importLine = `import StackAuthProvider from './providers/stack-provider';`;
      layoutContent = layoutContent.replace(
        /(import[^;]+from[^;]+;)/,
        `$1\n${importLine}`
      );
    }
    
    // Wrap children with StackAuthProvider if not already wrapped
    if (!layoutContent.includes('StackAuthProvider')) {
      layoutContent = layoutContent.replace(
        /(<body[^>]*>)([\s\S]*?)(<\/body>)/,
        `$1\n        <StackAuthProvider>\n          $2\n        </StackAuthProvider>\n      $3`
      );
    }
    
    fs.writeFileSync(layoutPath, layoutContent);
    log('Updated layout.tsx', 'success');
  } else {
    log('layout.tsx not found. Please manually wrap your app with StackAuthProvider', 'warning');
  }

  // Step 7: Create authentication components
  log('Creating authentication components...', 'info');
  const authDir = path.join('src', 'components', 'auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // User button component
  const userButtonContent = `'use client';

import { useUser, UserButton } from "@stackframe/stack";

export default function AuthUserButton() {
  const user = useUser();
  
  if (!user) {
    return (
      <div className="flex gap-2">
        <a href="/handler/sign-in" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Sign In
        </a>
        <a href="/handler/sign-up" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Sign Up
        </a>
      </div>
    );
  }
  
  return <UserButton />;
}`;

  fs.writeFileSync(path.join(authDir, 'user-button.tsx'), userButtonContent);
  log('Created user-button.tsx', 'success');

  // Auth status component
  const authStatusContent = `'use client';

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
}`;

  fs.writeFileSync(path.join(authDir, 'auth-status.tsx'), authStatusContent);
  log('Created auth-status.tsx', 'success');

  // Step 8: Create .env.example with all required variables
  log('Creating environment variables template...', 'info');
  const envExampleContent = `# ============================================
# NEON DATABASE CONFIGURATION
# ============================================
DATABASE_URL=postgresql://neondb_owner:npg_zSmWfO47Clbq@ep-floral-union-adtuqc88-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NEON_DATABASE_URL=postgresql://neondb_owner:npg_zSmWfO47Clbq@ep-floral-union-adtuqc88-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# ============================================
# NEON AUTH CONFIGURATION (Stack Auth)
# ============================================
NEXT_PUBLIC_STACK_PROJECT_ID=prj_live_sk_b18a0a963e5bfb0cfe17c5b0ff962bdd74e06f19
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pk_live_pk_03c9a96aa2ae6f699fc98c3c06ec03c6f0e067e1
STACK_SECRET_SERVER_KEY=sk_live_sk_ee9e2f686a92e926ce68c86bdb98f3a0f87b8f8a

# ============================================
# NEON DATA API
# ============================================
NEON_DATA_API_ENDPOINT=https://ep-floral-union-adtuqc88.apirest.c-2.us-east-1.aws.neon.tech/neondb/rest/v1

# ============================================
# AI SERVICES
# ============================================
OPENAI_API_KEY=[YOUR_OPENAI_API_KEY_HERE]
ANTHROPIC_API_KEY=[YOUR_ANTHROPIC_API_KEY_HERE]
GEMINI_API_KEY=AIzaSyAEpBsYR4n54DmT1h2vm8ZO_448x5s6uMs
DEEPSEEK_API_KEY=sk-your-deepseek-key-here
SPORTS_IO_API_KEY=bab44477ed904140b43630a7520517e7

# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV=production
`;

  fs.writeFileSync('.env.production', envExampleContent);
  log('Created .env.production', 'success');

  // Step 9: Create Vercel environment variables file
  log('Creating Vercel deployment guide...', 'info');
  const vercelEnvContent = `# VERCEL ENVIRONMENT VARIABLES
# ============================================
# Copy and paste these into your Vercel project settings
# Go to: Your Project → Settings → Environment Variables
# ============================================

# DATABASE (Required)
DATABASE_URL=postgresql://neondb_owner:npg_zSmWfO47Clbq@ep-floral-union-adtuqc88-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NEON_DATABASE_URL=postgresql://neondb_owner:npg_zSmWfO47Clbq@ep-floral-union-adtuqc88-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# AUTHENTICATION (Required)
NEXT_PUBLIC_STACK_PROJECT_ID=prj_live_sk_b18a0a963e5bfb0cfe17c5b0ff962bdd74e06f19
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pk_live_pk_03c9a96aa2ae6f699fc98c3c06ec03c6f0e067e1
STACK_SECRET_SERVER_KEY=sk_live_sk_ee9e2f686a92e926ce68c86bdb98f3a0f87b8f8a

# DATA API (Required)
NEON_DATA_API_ENDPOINT=https://ep-floral-union-adtuqc88.apirest.c-2.us-east-1.aws.neon.tech/neondb/rest/v1

# AI SERVICES (Required for AI features)
OPENAI_API_KEY=[YOUR_OPENAI_API_KEY_HERE]
ANTHROPIC_API_KEY=[YOUR_ANTHROPIC_API_KEY_HERE]
GEMINI_API_KEY=AIzaSyAEpBsYR4n54DmT1h2vm8ZO_448x5s6uMs
SPORTS_IO_API_KEY=bab44477ed904140b43630a7520517e7

# ENVIRONMENT (Set automatically by Vercel)
NODE_ENV=production
`;

  fs.writeFileSync('VERCEL_ENV_VARS.txt', vercelEnvContent);
  log('Created VERCEL_ENV_VARS.txt', 'success');

  // Step 10: Test build
  log('Testing build configuration...', 'info');
  execCommand('npm run build', 'Building application');

  // Success message
  console.log(`\n${colors.bright}${colors.green}✨ Setup Complete!${colors.reset}\n`);
  console.log(`${colors.cyan}Next Steps:${colors.reset}`);
  console.log(`1. Check ${colors.yellow}VERCEL_ENV_VARS.txt${colors.reset} for all environment variables`);
  console.log(`2. Add them to your Vercel project settings`);
  console.log(`3. Test authentication at ${colors.blue}/handler/sign-up${colors.reset}`);
  console.log(`4. Users will be synced to ${colors.green}neon_auth.users_sync${colors.reset} table`);
  console.log(`\n${colors.bright}Authentication Routes:${colors.reset}`);
  console.log(`  • Sign Up: /handler/sign-up`);
  console.log(`  • Sign In: /handler/sign-in`);
  console.log(`  • Sign Out: /handler/sign-out`);
  console.log(`\n${colors.bright}Components Available:${colors.reset}`);
  console.log(`  • <AuthUserButton /> - Sign in/out button`);
  console.log(`  • <AuthStatus /> - Shows auth status`);
}

// Run the setup
setupAuth().catch(error => {
  console.error(`\n${colors.red}Setup failed:${colors.reset}`, error);
  process.exit(1);
});