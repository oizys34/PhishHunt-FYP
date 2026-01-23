import React, { useState } from 'react';
import { Mail, MessageSquare, Wifi, Shield, AlertTriangle, CheckCircle, XCircle, BookOpen, Key, RefreshCw, Lock, Eye, Phone, Monitor, File, Trash2, Scan, WifiOff, FileX, Link, Globe, Search, FileText } from 'lucide-react';

const Learn = () => {
  const [activeTab, setActiveTab] = useState('email');

  const emailTips = [
    {
      title: "Check the Sender's Email Address",
      description: "Always verify the sender's email address. Look for misspellings, suspicious domains, or addresses that don't match the claimed organization.",
      icon: <Mail className="h-6 w-6 text-primary-600" />,
      example: "❌ security@bankofamerica-security.com\n✅ security@bankofamerica.com"
    },
    {
      title: "Beware of Urgent Language",
      description: "Phishing emails use urgent or threatening language to pressure you into quick action. Legitimate organizations rarely require immediate action.",
      icon: <AlertTriangle className="h-6 w-6 text-danger-600" />,
      example: "❌ 'URGENT: Verify now or account will be closed!'\n✅ 'Please update your information when convenient'"
    },
    {
      title: "Hover Over Links Before Clicking",
      description: "Before clicking any link, hover your mouse over it to see the actual destination URL. Verify it matches what you expect.",
      icon: <Shield className="h-6 w-6 text-success-600" />,
      example: "❌ Link shows 'bank.com' but goes to 'bank-security-verify.net'\n✅ Link destination matches the displayed text"
    },
    {
      title: "Check for Poor Grammar and Spelling",
      description: "Legitimate organizations maintain professional communication standards. Multiple spelling errors or poor grammar are red flags.",
      icon: <BookOpen className="h-6 w-6 text-primary-600" />,
      example: "❌ 'Your acount has been compromise!'\n✅ 'Your account has been compromised.'"
    }
  ];

  const smsTips = [
    {
      title: "Verify the Sender",
      description: "Check if the phone number or sender name matches the legitimate organization. Be suspicious of generic names or unknown numbers.",
      icon: <MessageSquare className="h-6 w-6 text-success-600" />,
      example: "❌ Generic sender: 'Bank Alert'\n✅ Specific sender: 'Chase Bank'"
    },
    {
      title: "Never Click Links in SMS",
      description: "Legitimate organizations rarely send links via SMS. If you need to access your account, go directly to their official website or app.",
      icon: <XCircle className="h-6 w-6 text-danger-600" />,
      example: "❌ 'Click here to verify: bit.ly/verify123'\n✅ 'Call us at 1-800-BANK-123'"
    },
    {
      title: "Look for Suspicious Requests",
      description: "Be wary of requests for personal information, passwords, or immediate action. Legitimate companies won't ask for sensitive data via SMS.",
      icon: <AlertTriangle className="h-6 w-6 text-danger-600" />,
      example: "❌ 'Reply with your password to unlock account'\n✅ 'Your account is temporarily locked. Call us to unlock.'"
    },
    {
      title: "Check for Urgency Tactics",
      description: "Scammers use urgency and fear to bypass your critical thinking. Take time to verify before taking any action.",
      icon: <Shield className="h-6 w-6 text-primary-600" />,
      example: "❌ 'Act now! Account closing in 1 hour!'\n✅ 'Please update your information by month-end'"
    }
  ];

  const wifiTips = [
    {
      title: "Avoid Open Networks",
      description: "Open Wi-Fi networks are unsecured and can be easily compromised by attackers.",
      icon: <Wifi className="h-6 w-6 text-danger-600" />,
      example: "❌ 'Free_WiFi' (Open)\n✅ 'Starbucks_WiFi' (WPA2)"
    },
    {
      title: "Verify Network Names",
      description: "Ask staff for the correct network name to avoid connecting to fake networks.",
      icon: <Shield className="h-6 w-6 text-success-600" />,
      example: "❌ 'Hotel_Guest_WiFi' (could be fake)\n✅ 'Marriott_Guest_Network' (verified with staff)"
    },
    {
      title: "Use VPN on Public Wi-Fi",
      description: "Always use a VPN when connecting to public Wi-Fi networks.",
      icon: <Shield className="h-6 w-6 text-primary-600" />,
      example: "✅ Connect to VPN before browsing on public networks"
    },
    {
      title: "Check Signal Strength",
      description: "Be suspicious of networks with unusually strong signals in unexpected locations.",
      icon: <AlertTriangle className="h-6 w-6 text-danger-600" />,
      example: "❌ 'Free_WiFi' with 100% signal in remote area\n✅ Reasonable signal strength for location"
    }
  ];

  const generalTips = [
    {
      title: "Trust Your Instincts",
      description: "If something feels off, it probably is. Take time to verify before acting.",
      icon: <Shield className="h-6 w-6 text-primary-600" />,
      example: "When in doubt, contact the organization directly through official channels"
    },
    {
      title: "Keep Software Updated",
      description: "Regular updates patch security vulnerabilities that attackers exploit.",
      icon: <CheckCircle className="h-6 w-6 text-success-600" />,
      example: "Enable automatic updates for your operating system and applications"
    },
    {
      title: "Use Strong, Unique Passwords",
      description: "Use a password manager to generate and store unique passwords for each account.",
      icon: <Shield className="h-6 w-6 text-primary-600" />,
      example: "Use 12+ character passwords with mixed case, numbers, and symbols"
    },
    {
      title: "Enable Two-Factor Authentication",
      description: "2FA adds an extra layer of security even if your password is compromised.",
      icon: <Shield className="h-6 w-6 text-success-600" />,
      example: "Enable 2FA on all accounts that support it, especially banking and email"
    }
  ];

  const getTips = () => {
    switch (activeTab) {
      case 'email':
        return emailTips;
      case 'sms':
        return smsTips;
      case 'wifi':
        return wifiTips;
      case 'general':
        return generalTips;
      default:
        return emailTips;
    }
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'sms':
        return <MessageSquare className="h-5 w-5" />;
      case 'wifi':
        return <Wifi className="h-5 w-5" />;
      case 'general':
        return <Shield className="h-5 w-5" />;
      default:
        return <Mail className="h-5 w-5" />;
    }
  };

  const getTabColor = (tab) => {
    switch (tab) {
      case 'email':
        return 'text-primary-600';
      case 'sms':
        return 'text-success-600';
      case 'wifi':
        return 'text-danger-600';
      case 'general':
        return 'text-gray-600';
      default:
        return 'text-primary-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-green-100">
      <div className="max-w-[95rem] mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Cybersecurity Learning Center
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn how to identify and protect yourself from social engineering attacks. 
            Knowledge is your best defense against cyber threats.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'email', name: 'Email Phishing', icon: <Mail className="h-5 w-5" /> },
                { id: 'sms', name: 'SMS Smishing', icon: <MessageSquare className="h-5 w-5" /> },
                { id: 'wifi', name: 'Wi-Fi Wiphishing', icon: <Wifi className="h-5 w-5" /> },
                { id: 'general', name: 'General Security', icon: <Shield className="h-5 w-5" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Email Verification Tools - Full Width Section - Only for Email */}
        {activeTab === 'email' && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Search className="h-6 w-6 mr-2 text-primary-600" />
              Email Verification Tools
            </h2>
            <div className="card bg-blue-50 border-2 border-blue-300">
              <p className="text-sm text-blue-800 mb-6">
                Use these free tools to check if an email or link is safe:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Link & File Scanners */}
                <div>
                  <h4 className="text-sm font-bold text-blue-900 mb-3">Link & File Scanners</h4>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-start space-x-3 mb-2">
                        <Link className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-blue-900">VirusTotal</p>
                          <p className="text-xs text-blue-800 mt-1">Scan suspicious links and file attachments. Checks them against many antivirus engines to see if they're dangerous.</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-start space-x-3 mb-2">
                        <Globe className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-blue-900">URLScan.io</p>
                          <p className="text-xs text-blue-800 mt-1">Analyzes a link in a safe environment. Shows you where the link goes, what it loads, and even takes a screenshot of the page.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Header Checker */}
                <div>
                  <h4 className="text-sm font-bold text-blue-900 mb-3">Email Header Checker</h4>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start space-x-3 mb-4">
                      <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900">MXToolbox</p>
                        <p className="text-xs text-blue-800 mt-1">Checks email headers to see if the email is real or fake. Shows SPF, DKIM, and DMARC records to verify the sender.</p>
                      </div>
                    </div>
                    
                    {/* How to Get Email Headers Tutorial */}
                    <div className="pt-4 border-t border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 mb-3">How to Get Email Headers:</p>
                      <div className="space-y-2 text-xs text-blue-800">
                        <p><strong>1.</strong> Open the suspicious email in your email app (Gmail, Outlook, etc.)</p>
                        <p><strong>2.</strong> Find the option to view email headers:</p>
                        <div className="ml-4 space-y-1 mt-1">
                          <p>• <strong>Gmail:</strong> Click the three dots (⋮) → "Show original"</p>
                          <p>• <strong>Outlook (web):</strong> Click the three dots (⋯) → View → "View message details"</p>
                          <p>• <strong>Other apps:</strong> Look for "View source" or "Message headers" in the menu</p>
                        </div>
                        <p className="mt-2"><strong>3.</strong> Copy all the header text and paste it into MXToolbox's header analyzer</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SMS Verification Tools - Full Width Section - Only for SMS */}
        {activeTab === 'sms' && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Search className="h-6 w-6 mr-2 text-primary-600" />
              SMS Verification Tools
            </h2>
            <div className="card bg-blue-50 border-2 border-blue-300">
              <p className="text-sm text-blue-800 mb-6">
                Use these free tools to check if an SMS link or sender is safe:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Link Scanners - For PC/Trusted Device */}
                <div>
                  <h4 className="text-sm font-bold text-blue-900 mb-3">Link Scanners (Use on PC or Trusted Device)</h4>
                  <p className="text-xs text-blue-700 mb-3">⚠️ Don't click the link directly on your phone. Copy it and check it on a computer or trusted device first.</p>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-start space-x-3 mb-2">
                        <Link className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-blue-900">VirusTotal</p>
                          <p className="text-xs text-blue-800 mt-1">Paste the suspicious link here. It checks the link against many antivirus engines and reputation databases to see if it's dangerous.</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-start space-x-3 mb-2">
                        <Globe className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-blue-900">URLScan.io</p>
                          <p className="text-xs text-blue-800 mt-1">Paste the link here. It opens the link in a safe environment and shows you where it redirects, what it loads, and takes a screenshot so you can see what the page looks like.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Tools */}
                <div>
                  <h4 className="text-sm font-bold text-blue-900 mb-3">Mobile Protection Apps</h4>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start space-x-3 mb-2">
                      <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900">Truecaller</p>
                        <p className="text-xs text-blue-800 mt-1">A mobile app that helps identify unknown phone numbers, block spam calls and messages, and protect you from fraud. Install it on your phone to see who's calling or texting you.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`grid gap-10 ${(activeTab === 'email' || activeTab === 'sms' || activeTab === 'wifi') ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
          {/* Left Column: Prevention Tips */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {activeTab === 'email' && 'Email Phishing Prevention'}
              {activeTab === 'sms' && 'SMS Smishing Prevention'}
              {activeTab === 'wifi' && 'Wi-Fi Security Best Practices'}
              {activeTab === 'general' && 'General Cybersecurity Tips'}
            </h2>

            {getTips().map((tip, index) => (
              <div key={index} className="card">
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 ${getTabColor(activeTab)}`}>
                    {tip.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {tip.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {tip.description}
                    </p>
                    {tip.example && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700 font-mono whitespace-pre-line">
                          {tip.example}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Middle Column: Remediation Steps - Only for Email, SMS, and Wi-Fi */}
          {(activeTab === 'email' || activeTab === 'sms' || activeTab === 'wifi') && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Remediation Steps
              </h2>

            {/* Remediation Steps - Only for Email and SMS */}
            {(activeTab === 'email' || activeTab === 'sms') && (
              <div className="card bg-orange-50 border-2 border-orange-300">
                <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                  If You Clicked a Phishing Link
                </h3>
                <p className="text-sm text-orange-800 mb-4 font-medium">
                  If you accidentally clicked a link and entered credentials, take these steps immediately:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Key className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">Change Password Immediately</p>
                      <p className="text-xs text-orange-800 mt-1">Go to the real website (type the URL manually or use a saved bookmark). Change the password right away. If you reused that password elsewhere, change those too.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Lock className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">Enable Multi-Factor Authentication</p>
                      <p className="text-xs text-orange-800 mt-1">Turn on 2FA/MFA if available. If it was already on, check for suspicious login attempts or new devices.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Monitor className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">Review Account Settings</p>
                      <p className="text-xs text-orange-800 mt-1">Check recent logins, connected devices, and active sessions. Log out of all other sessions. Verify recovery email and phone number - remove anything unfamiliar.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Phone className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">Inform Relevant Parties</p>
                      <p className="text-xs text-orange-800 mt-1">If it's a work account, report to IT/security immediately. For personal accounts (bank, email, shopping), contact the provider if you see anything suspicious.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Eye className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">Monitor for Suspicious Activity</p>
                      <p className="text-xs text-orange-800 mt-1">Watch your inbox, bank/credit card, and important accounts. If financial info was involved, contact your bank to add extra monitoring or temporary blocks.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RefreshCw className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">Report the Phishing Message</p>
                      <p className="text-xs text-orange-800 mt-1">Use the "Report phishing" or "Report spam" option in your email or SMS app. Delete the message so you don't click it again.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Attachment Remediation - Only for Email */}
            {activeTab === 'email' && (
              <div className="card bg-red-50 border-2 border-red-300">
                <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                  <File className="h-5 w-5 mr-2 text-red-600" />
                  If You Downloaded a Suspicious Attachment
                </h3>
                
                {/* Scenario 1: Downloaded but not opened */}
                <div className="mb-6 pb-4 border-b border-red-200">
                  <h4 className="text-sm font-bold text-red-900 mb-3 flex items-center">
                    <FileX className="h-4 w-4 mr-2 text-red-600" />
                    File Downloaded But NOT Opened
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-800"><strong>Do NOT open or run the file.</strong> Don't double-click, preview, or unzip it.</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Trash2 className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-800"><strong>Delete the file safely.</strong> Remove it from Downloads and empty Recycle Bin/Trash.</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Scan className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-800"><strong>Run a full antivirus scan</strong> on your device.</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RefreshCw className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-800"><strong>Report it.</strong> At work: report to IT/security with screenshot. At home: mark as phishing/spam and delete.</p>
                    </div>
                  </div>
                </div>

                {/* Scenario 2: File opened/executed */}
                <div>
                  <h4 className="text-sm font-bold text-red-900 mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                    File Opened or Executed (Higher Risk)
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <Monitor className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-800"><strong>Stop using the device</strong> for sensitive activities (banking, email, work systems) until checked.</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <WifiOff className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-800"><strong>Disconnect from network</strong> if possible. Turn off Wi-Fi or unplug network cable to prevent data theft or spreading.</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Phone className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-800"><strong>Contact IT/security immediately</strong> (for work devices). Tell them exactly what happened. Don't try to fix it yourself first.</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Scan className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-800"><strong>Run full antivirus scan.</strong> If at home, run a full scan and follow recommendations (quarantine/remove threats).</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Key className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-800"><strong>Change passwords from a clean device.</strong> If you used that device for important accounts, change passwords from another known-clean device.</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RefreshCw className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-800"><strong>Report the email.</strong> Use "Report phishing" in your email client. Keep the email for evidence but don't open the attachment again.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wi-Fi Remediation - Only for Wi-Fi */}
            {activeTab === 'wifi' && (
              <div className="card bg-orange-50 border-2 border-orange-300">
                <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                  <Wifi className="h-5 w-5 mr-2 text-orange-600" />
                  If You Connected to a Suspicious Wi-Fi Network
                </h3>
                <p className="text-sm text-orange-800 mb-4 font-medium">
                  If you connected to a fake or suspicious Wi-Fi network, do these steps right away:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <WifiOff className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">Disconnect Right Away</p>
                      <p className="text-xs text-orange-800 mt-1">Turn off Wi-Fi or use mobile data instead. Go to your Wi-Fi settings and "Forget" this network so your device won't connect to it again.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">Assume Your Info Was Seen</p>
                      <p className="text-xs text-orange-800 mt-1">Any passwords, codes, or personal information you typed while connected might have been stolen. Act as if someone saw everything.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Key className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">Change Your Passwords</p>
                      <p className="text-xs text-orange-800 mt-1">Using a safe network (like your home Wi-Fi or mobile data), change passwords for: Email, Banking apps, Work accounts, and any other accounts you used.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Lock className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">Turn on Two-Factor Authentication</p>
                      <p className="text-xs text-orange-800 mt-1">Enable 2FA or MFA on your accounts if you haven't already. This adds an extra layer of protection.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Eye className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">Watch for Strange Activity</p>
                      <p className="text-xs text-orange-800 mt-1">Check your accounts for unusual logins, password reset emails, or transactions you didn't make. If it's a work account, tell your IT team right away.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">Stay Safe in the Future</p>
                      <p className="text-xs text-orange-800 mt-1">Always ask staff for the correct Wi-Fi name before connecting. Use networks you trust or mobile data for banking and important logins. Use a VPN if your company provides one.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          )}

          {/* Right Column: Quick Reference */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Quick Reference
            </h2>

            {/* Red Flags Checklist */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-danger-600" />
                Red Flags Checklist
              </h3>
              <div className="space-y-2">
                {[
                  'Urgent or threatening language',
                  'Requests for personal information',
                  'Suspicious links or attachments',
                  'Poor grammar or spelling',
                  'Unfamiliar sender addresses',
                  'Offers that seem too good to be true'
                ].map((flag, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-danger-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{flag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Practices */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-success-600" />
                Best Practices
              </h3>
              <div className="space-y-2">
                {[
                  'Verify sender identity through official channels',
                  'Hover over links before clicking',
                  'Use strong, unique passwords',
                  'Enable two-factor authentication',
                  'Keep software updated',
                  'Use VPN on public Wi-Fi'
                ].map((practice, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-success-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{practice}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Actions */}
            <div className="card bg-danger-50 border border-danger-200">
              <h3 className="text-lg font-semibold text-danger-800 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                If You Suspect an Attack
              </h3>
              <div className="space-y-2 text-sm text-danger-700">
                <p>1. <strong>Don't click any links</strong> in suspicious messages</p>
                <p>2. <strong>Don't provide personal information</strong> to unknown sources</p>
                <p>3. <strong>Contact the organization directly</strong> through official channels</p>
                <p>4. <strong>Report the incident</strong> to your IT department or security team</p>
                <p>5. <strong>Change passwords</strong> if you suspect account compromise</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learn;


