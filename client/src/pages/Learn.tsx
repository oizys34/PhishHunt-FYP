import React, { useState } from 'react';
import { Mail, MessageSquare, Wifi, Shield, AlertTriangle, CheckCircle, XCircle, BookOpen } from 'lucide-react';

const Learn: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'email' | 'sms' | 'wifi' | 'general'>('email');

  const emailTips = [
    {
      title: "Check the Sender's Email Address",
      description: "Look for misspellings, suspicious domains, or addresses that don't match the claimed organization.",
      icon: <Mail className="h-6 w-6 text-primary-600" />,
      example: "❌ security@bankofamerica-security.com\n✅ security@bankofamerica.com"
    },
    {
      title: "Beware of Urgent Language",
      description: "Phishing emails often use urgent language to pressure you into quick action without thinking.",
      icon: <AlertTriangle className="h-6 w-6 text-danger-600" />,
      example: "❌ 'URGENT: Verify now or account will be closed!'\n✅ 'Please update your information when convenient'"
    },
    {
      title: "Hover Over Links",
      description: "Before clicking any link, hover over it to see the actual destination URL.",
      icon: <Shield className="h-6 w-6 text-success-600" />,
      example: "❌ Link shows 'bank.com' but goes to 'bank-security-verify.net'\n✅ Link destination matches the displayed text"
    },
    {
      title: "Check for Poor Grammar",
      description: "Legitimate organizations typically have professional communication standards.",
      icon: <BookOpen className="h-6 w-6 text-primary-600" />,
      example: "❌ 'Your acount has been compromise!'\n✅ 'Your account has been compromised.'"
    }
  ];

  const smsTips = [
    {
      title: "Verify the Sender",
      description: "Check if the number or sender name matches the legitimate organization.",
      icon: <MessageSquare className="h-6 w-6 text-success-600" />,
      example: "❌ Generic sender: 'Bank Alert'\n✅ Specific sender: 'Chase Bank'"
    },
    {
      title: "Never Click Links in SMS",
      description: "Legitimate organizations rarely send links via SMS. Contact them directly instead.",
      icon: <XCircle className="h-6 w-6 text-danger-600" />,
      example: "❌ 'Click here to verify: bit.ly/verify123'\n✅ 'Call us at 1-800-BANK-123'"
    },
    {
      title: "Look for Suspicious Requests",
      description: "Be wary of requests for personal information or immediate action.",
      icon: <AlertTriangle className="h-6 w-6 text-danger-600" />,
      example: "❌ 'Reply with your password to unlock account'\n✅ 'Your account is temporarily locked. Call us to unlock.'"
    },
    {
      title: "Check for Urgency Tactics",
      description: "Scammers use urgency to bypass your critical thinking.",
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

  const getTabIcon = (tab: string) => {
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

  const getTabColor = (tab: string) => {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                  onClick={() => setActiveTab(tab.id as any)}
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

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Tips Section */}
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

          {/* Quick Reference */}
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


