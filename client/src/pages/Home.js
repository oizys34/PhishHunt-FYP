import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Target, Users, Award, ArrowRight, Mail, MessageSquare, Wifi } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              PhishHunt
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              A Randomized Web Simulation Game for Social Engineering Threat Detection
            </p>
            <p className="text-lg mb-10 text-primary-200 max-w-3xl mx-auto">
              Train yourself to identify and respond to phishing, smishing, and wiphishing attacks 
              through interactive scenarios that test your cybersecurity awareness.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/game-mode" 
                className="btn-primary bg-white text-primary-600 hover:bg-gray-100 inline-flex items-center justify-center px-8 py-3 text-lg font-semibold"
              >
                Start Training
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                to="/learn" 
                className="btn-secondary bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-600 inline-flex items-center justify-center px-8 py-3 text-lg font-semibold"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose PhishHunt?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our simulation game provides realistic training scenarios to help you develop 
              the skills needed to recognize and avoid social engineering attacks.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Realistic Scenarios</h3>
              <p className="text-gray-600">
                95+ carefully crafted scenarios based on real-world social engineering attacks
              </p>
            </div>

            <div className="text-center">
              <div className="bg-success-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Learning</h3>
              <p className="text-gray-600">
                Hands-on experience with immediate feedback to accelerate your learning
              </p>
            </div>

            <div className="text-center">
              <div className="bg-danger-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-danger-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Performance Tracking</h3>
              <p className="text-gray-600">
                Detailed analytics to track your progress and identify areas for improvement
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Comprehensive Coverage</h3>
              <p className="text-gray-600">
                Training for email phishing, SMS smishing, and Wi-Fi wiphishing attacks
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simulation Types Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Three Types of Social Engineering Attacks
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Master the art of detecting different types of social engineering attacks
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Email Phishing */}
            <div className="card text-center">
              <div className="bg-primary-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Mail className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Email Phishing</h3>
              <p className="text-gray-600 mb-6">
                Learn to identify suspicious emails, fake sender addresses, and malicious links 
                in 50+ realistic email scenarios.
              </p>
              <Link 
                to="/simulation/email" 
                className="btn-primary inline-flex items-center"
              >
                Practice Email Detection
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* SMS Smishing */}
            <div className="card text-center">
              <div className="bg-success-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-10 w-10 text-success-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">SMS Smishing</h3>
              <p className="text-gray-600 mb-6">
                Train yourself to spot suspicious text messages and avoid clicking malicious 
                links in 30+ SMS scenarios.
              </p>
              <Link 
                to="/simulation/sms" 
                className="btn-primary inline-flex items-center"
              >
                Practice SMS Detection
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* Wi-Fi Wiphishing */}
            <div className="card text-center">
              <div className="bg-danger-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Wifi className="h-10 w-10 text-danger-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Wi-Fi Wiphishing</h3>
              <p className="text-gray-600 mb-6">
                Develop skills to identify malicious Wi-Fi networks and protect yourself 
                from man-in-the-middle attacks in 15+ scenarios.
              </p>
              <Link 
                to="/simulation/wifi" 
                className="btn-primary inline-flex items-center"
              >
                Practice Wi-Fi Detection
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Test Your Cybersecurity Skills?
          </h2>
          <p className="text-xl mb-10 text-primary-100">
            Join thousands of users who have improved their security awareness through PhishHunt.
          </p>
          <Link 
            to="/game-mode" 
            className="btn-primary bg-white text-primary-600 hover:bg-gray-100 inline-flex items-center justify-center px-8 py-4 text-lg font-semibold"
          >
            Start Your Training Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;


