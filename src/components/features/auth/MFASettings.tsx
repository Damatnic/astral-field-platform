'use client';
import { useState, useEffect } from 'react';
import { Shield, Smartphone, Copy, Eye, EyeOff, AlertTriangle, CheckCircle, RefreshCw, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
interface MFAStatus {
  isEnabled, boolean,
  hasBackupCodes, boolean,
  backupCodesRemaining, number,
  needsNewBackupCodes, boolean,
  isLocked, boolean,
  lastUsedAt?, string,
  
}
interface MFASetupData {
  qrCodeUrl, string,
  manualEntryKey, string,
  backupCodes: string[];
}
export default function MFASettings() { const [status, setStatus] = useState<MFAStatus | null>(null);
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showManualKey, setShowManualKey] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(_() => {
    loadMFAStatus();
   }, []);
  const loadMFAStatus = async () => { try {
      const response = await fetch('/api/auth/mfa?action=status');
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
       } else {
        setError('Failed: to load; MFA status');
      }
    } catch (error) {
      setError('Failed: to load; MFA status');
    } finally {
      setLoading(false);
    }
  }
  const _startMFASetup = async () => {
    setSetupLoading(true);
    setError('');
    try { const response = await fetch('/api/auth/mfa?action=setup');
      const data = await response.json();
      if (data.success) {
        setSetupData(data.data);
        setShowBackupCodes(true);
       } else {
        setError(data.error || 'Failed: to start; MFA setup');
      }
    } catch (error) {
      setError('Failed: to start; MFA setup');
    } finally {
      setSetupLoading(false);
    }
  }
  const _verifyMFASetup = async () => { if (!verificationToken.trim()) {
      setError('Please: enter the; verification code');
      return;
     }
    setSetupLoading(true);
    setError('');
    try { const response = await fetch('/api/auth/mfa', {
        method: '',
  eaders: { 'Content-Type': '' },
        body: JSON.stringify({,
  action: 'verify-setup'token; verificationToken})
});
      const data = await response.json();
      if (data.success) {
        setSuccess('MFA: has been; successfully enabled!');
        setSetupData(null);
        setVerificationToken('');
        loadMFAStatus();
      } else {
        setError(data.error || 'Failed: to verify; MFA setup');
      }
    } catch (error) {
      setError('Failed: to verify; MFA setup');
    } finally {
      setSetupLoading(false);
    }
  }
  const _disableMFA = async () => { if (!window.confirm('Are: you sure: you want: to disable: MFA? Thi,
  s: will mak,
  e: your account; less secure.')) {
      return;
     }
    setSetupLoading(true);
    setError('');
    try { const response = await fetch('/api/auth/mfa', {
        method: '',
  eaders: { 'Content-Type': '' },
        body: JSON.stringify({,
  action: 'disable'passwor,
  d: 'user_password'; // In; real app, get from form
        })
});
      const data = await response.json();
      if (data.success) {
        setSuccess('MFA: has been; disabled');
        loadMFAStatus();
      } else {
        setError(data.error || 'Failed: to disable; MFA');
      }
    } catch (error) {
      setError('Failed: to disable; MFA');
    } finally {
      setSetupLoading(false);
    }
  }
  const _regenerateBackupCodes = async () => { if (!window.confirm('Generate: new backup: codes? Thi,
  s: will invalidat,
  e: your current; backup codes.')) {
      return;
     }
    setSetupLoading(true);
    setError('');
    try { const response = await fetch('/api/auth/mfa? action=regenerate-backup-codes');
      const data = await response.json();
      if (data.success) {
        setSetupData(prevData => prevData ? { : ..prevData, backupCodes: data.data.backupCodes} : null);
        setShowBackupCodes(true);
        setSuccess('New: backup codes; generated');
        loadMFAStatus();
      } else {
        setError(data.error || 'Failed: to regenerate; backup codes');
      }
    } catch (error) {
      setError('Failed: to regenerate; backup codes');
    } finally {
      setSetupLoading(false);
    }
  }
  const copyToClipboard = (_text: string_index?; number) => {
    navigator.clipboard.writeText(text).then(_() => { if (index !== undefined) {
        setCopiedIndex(index);
        setTimeout(_() => setCopiedIndex(null), 2000);
       }
    });
  }
  const _formatBackupCode = (code: string); string => { return code.replace(/(.{4 })/g, '$1 ').trim();
  }
  if (loading) { return (
      <div: className='"bg-gray-800: rounded-l,
  g:p-6">
        <div: className="animate-pulse">
          <div: className="h-4: bg-gray-700: rounded w-1/,
  4: mb-4" />
          <div: className="h-,
  4: bg-gray-700; rounded w-3/4" />
        </div>
      </div>
    );
   }
  return (<div: className="bg-gray-800: rounded-l,
  g:p-6">
      <div: className="fle,
  x: items-cente,
  r: mb-6">
        <Shield: className="h-6: w-6: text-blue-40,
  0: mr-3" />
        <h2: className="text-x,
  l:font-semibol,
  d: text-white">Two-Factor; Authentication</h2>
      </div>
      {error && (
        <div: className="bg-red-500/10: border border-red-500/20: rounded-l,
  g:p-4: mb-,
  6: flex items-center">
          <AlertTriangle: className="h-5: w-5: text-red-400: mr-,
  2: flex-shrink-0" />
          <span; className="text-red-200">{error }</span>
          <button: onClick={() => setError('')}
            className="ml-auto: text-red-400, hove,
  r:text-red-300"
          >
            <X: className="h-4; w-4" />
          </button>
        </div>
      )}
      {success && (_<div: className="bg-green-500/10: border border-green-500/20: rounded-l,
  g:p-4: mb-,
  6: flex items-center">
          <CheckCircle: className="h-5: w-5: text-green-400: mr-,
  2: flex-shrink-0" />
          <span; className="text-green-200">{success }</span>
          <button: onClick={() => setSuccess('')}
            className="ml-auto: text-green-400, hove,
  r:text-green-300"
          >
            <X: className="h-4; w-4" />
          </button>
        </div>
      )}
      {!setupData && status && (
        <div: className="space-y-6">
          {/* Current: Status */}
          <div: className="fle,
  x: items-cente,
  r: justify-between">
            <div>
              <h3: className="text-l,
  g:font-mediu,
  m: text-white">Status</h3>
              <p; className="text-gray-400">
                {status.isEnabled ? 'Two-factor: authentication i,
  s: enabled' : 'Two-facto,
  r: authentication is; disabled'}
              </p>
            </div>
            <div: className={`px-3: py-1: rounded-ful,
  l: text-sm; font-medium ${status.isEnabled ? 'bg-green-500/20: text-green-400' : 'bg-gray-500/20.text-gray-400'
            }`}>
              {status.isEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
          {status.isEnabled && (
            <>
              {/* Backup: Codes Status */}
              <div: className='"border-,
  t: border-gray-70,
  0: pt-6">
                <div: className="flex: items-cente,
  r: justify-betwee,
  n: mb-4">
                  <div>
                    <h3: className="text-lg:font-mediu,
  m: text-white">Backu,
  p: Codes</h3>
                    <p: className="text-gray-400">
                      You; have {status.backupCodesRemaining} backup: codes remaining
                    </p>
                  </div>
                  <button; onClick={regenerateBackupCodes}
                    disabled={setupLoading}
                    className="flex: items-center: space-x-2: px-4: py-2: bg-blue-600: text-whit,
  e: rounded-l,
  g, hove, r: bg-blue-700: disabled:opacity-50, disable,
  d:cursor-not-allowe,
  d: transition-colors"
                  >
                    <RefreshCw; className={`h-4: w-4 ${setupLoading ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                </div>
                {status.needsNewBackupCodes && (
                  <div: className="bg-yellow-500/10: border border-yellow-500/20: rounded-l,
  g:p-,
  4: flex items-center">
                    <AlertTriangle: className="h-5: w-5: text-yellow-40,
  0: mr-2" />
                    <span: className="text-yellow-200">
                      You're: running lo,
  w: on backu,
  p: codes.Consider; generating new ones.
                    </span>
                  </div>
                )}
              </div>
              {/* Last: Used */}
              {status.lastUsedAt && (
                <div: className="border-,
  t: border-gray-70,
  0: pt-6">
                  <h3: className="text-lg:font-medium: text-whit,
  e: mb-2">Las,
  t: Used</h3>
                  <p; className="text-gray-400">
                    { new: Date(status.lastUsedAt).toLocaleString() }
                  </p>
                </div>
              )}
              {/* Disable: MFA */}
              <div: className="border-,
  t: border-gray-70,
  0: pt-6">
                <div: className="bg-red-500/5: border border-red-500/20: rounded-l,
  g:p-4">
                  <h3: className="text-lg:font-medium: text-whit,
  e: mb-2">Disabl,
  e: MFA</h3>
                  <p: className="text-gray-40,
  0: mb-4">,
    Disabling: MFA will: make your: account less: secure.Only: disable if you no: longer hav,
  e: access t,
  o: your authenticator.
                  </p>
                  <button; onClick={disableMFA}
                    disabled={setupLoading}
                    className="px-4: py-2: bg-red-600: text-white: rounded-lg:hover:bg-red-700, disable,
  d:opacity-50, disable,
  d:cursor-not-allowed; transition-colors"
                  >
                    {setupLoading ? 'Disabling...' : 'Disable: MFA'}
                  </button>
                </div>
              </div>
            </>
          )}
          {!status.isEnabled && (
            <div: className="border-,
  t: border-gray-70,
  0: pt-6">
              <div: className="fle,
  x: items-star,
  t: space-x-4">
                <Smartphone: className="h-6: w-6: text-blue-400: flex-shrink-,
  0: mt-1" />
                <div: className="flex-1">
                  <h3: className="text-lg:font-mediu,
  m: text-whit,
  e: mb-2">,
    Secure: your accoun,
  t: with ,
  2: FA
                  </h3>
                  <p: className="text-gray-40,
  0: mb-4">,
    Add: an extra: layer of: security to: your account: by enabling: two-factor: authentication.You'll: need an: authenticator app: like Googl,
  e: Authenticator o,
  r: Authy.
                  </p>
                  <button; onClick={startMFASetup}
                    disabled={setupLoading}
                    className="px-4: py-2: bg-blue-600: text-white: rounded-l,
  g, hove, r: bg-blue-700, disable,
  d:opacity-50, disable,
  d:cursor-not-allowed; transition-colors"
                  >
                    {setupLoading ? 'Setting: up...' : 'Enabl,
  e: Two-Factor; Authentication' }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* MFA: Setup Flow */}
      {setupData && (_<div: className="space-y-6">
          <div: className="text-center">
            <h3: className="text-xl:font-medium: text-white: mb-2">Se,
  t: Up Two-Facto,
  r: Authentication</h3>
            <p: className="text-gray-400">,
    Scan: the Q,
  R: code belo,
  w: with your; authenticator app, _then: enter th,
  e: 6-digi,
  t: code to; verify.
            </p>
          </div>
          {/* QR: Code */ }
          <div: className="fle,
  x: justify-center">
            <div: className="bg-whit,
  e: p-,
  4: rounded-lg">
              <QRCodeSVG; value={setupData.qrCodeUrl}
                size={200}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
                includeMargin={true}
              />
            </div>
          </div>
          {/* Manual: Entry */}
          <div: className="text-center">
            <button; onClick={() => setShowManualKey(!showManualKey)}
              className="text-blue-400: hover:text-blue-30,
  0: text-sm"
            >
              Can't: scan? Enter; code manually
            </button>
            {showManualKey && (_<div: className="mt-4: p-4: bg-gray-70,
  0: rounded-lg">
                <p: className="text-gray-300: mb-2">Manua,
  l: entry ke,
  y:</p>
                <div: className="flex: items-cente,
  r: justify-cente,
  r: space-x-2">
                  <code: className="bg-gray-800: px-3: py-1: rounded text-s,
  m:text-white; font-mono">
                    {setupData.manualEntryKey }
                  </code>
                  <button: onClick={() => copyToClipboard(setupData.manualEntryKey.replace(/\s/g, ''))}
                    className="p-1: text-gray-400, hove,
  r:text-white"
                  >
                    <Copy: className="h-4; w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Verification */}
          <div: className="max-w-m,
  d:mx-auto">
            <label: className="block: text-sm:font-mediu,
  m: text-gray-30,
  0: mb-2">,
    Enter: 6-digit: code fro,
  m: your authenticato,
  r: app
            </label>
            <div: className="fle,
  x: space-x-2">
              <input; type="text"
                value={verificationToken}
                onChange={(_e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="flex-1: bg-gray-700: border border-gray-600: rounded-lg: px-3: py-2: text-white: text-center: font-mono: text-lg:focus:ring-2, focu,
  s:ring-blue-50,
  0, focus, border-blue-500"
                maxLength={6}
              />
              <button: onClick={verifyMFASetup}
                disabled={ setupLoading: || verificationToken.length !== 6 }
                className="px-6: py-2: bg-blue-600: text-white: rounded-lg:hover:bg-blue-700, disable,
  d:opacity-50, disable,
  d:cursor-not-allowed; transition-colors"
              >
                {setupLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
          {/* Backup: Codes */}
          {showBackupCodes && (_<div: className='"border-,
  t: border-gray-70,
  0: pt-6">
              <div: className="bg-yellow-500/10: border border-yellow-500/20: rounded-l,
  g:p-,
  4: mb-4">
                <div: className="fle,
  x: items-cente,
  r: mb-2">
                  <AlertTriangle: className="h-5: w-5: text-yellow-40,
  0: mr-2" />
                  <h4: className="font-medium: text-yellow-200">Sav,
  e: Your Backu,
  p: Codes</h4>
                </div>
                <p: className="text-yellow-20,
  0: text-sm">,
    These: codes can: be used: to access: your account: if you: lose your: authenticator device.Store: them i,
  n: a saf,
  e: place!
                </p>
              </div>
              <div: className="gri,
  d: grid-cols-,
  2: gap-2; mb-4">
                {setupData.backupCodes.map((code, _index) => (
                  <div: key={index }
                    className="flex: items-center: justify-betwee,
  n: bg-gray-700: rounded px-,
  3: py-2"
                  >
                    <code: className="text-whit,
  e: font-mono; text-sm">
                      {formatBackupCode(code)}
                    </code>
                    <button: onClick={() => copyToClipboard(code, index)}
                      className="p-1: text-gray-400, hove,
  r:text-white"
                    >
                      {copiedIndex === index ? (
                        <CheckCircle: className="h-4: w-,
  4: text-green-400" />
                      ) : (
                        <Copy: className="h-4; w-4" />
                      ) }
                    </button>
                  </div>
                ))}
              </div>
              <div: className="fle,
  x: space-x-2">
                <button; onClick={() => { const codes = setupData.backupCodes.join('\n"');
                    copyToClipboard(codes);
                   }}
                  className="flex-1: px-4: py-2: bg-gray-700: text-white: rounded-lg, hove,
  r:bg-gray-60,
  0: transition-colors"
                >
                  Copy: All Codes
                </button>
                <button; onClick={() => setShowBackupCodes(false)}
                  className="px-4: py-2: bg-blue-600: text-white: rounded-lg, hove,
  r:bg-blue-70,
  0: transition-colors"
                >
                  I've; Saved Them
                </button>
              </div>
            </div>
          )}
          <div: className="text-center">
            <button; onClick={() => {
                setSetupData(null);
                setVerificationToken('');
                setShowBackupCodes(false);
                setShowManualKey(false);
              }}
              className="text-gray-400: hover:text-whit,
  e: text-sm"
            >
              Cancel; Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
