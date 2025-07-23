import React from 'react';
import { Mail, Phone } from 'lucide-react';

const AccessibilityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Logo Section */}
            <div className="lg:w-1/3 bg-emerald-700 flex items-center justify-center p-8 lg:p-12">
              <div className="text-center">
                <img 
                  src="/Fettermans_Logo.png" 
                  alt="Fetterman's Logo" 
                  className="w-32 h-32 lg:w-48 lg:h-48 object-contain mx-auto mb-4"
                />
                <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
                  Fetterman's
                </h1>
              </div>
            </div>
            
            {/* Content Section */}
            <div className="lg:w-2/3 p-8 lg:p-12">
              <div className="max-w-2xl">
                <h1 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-8">
                  Accessibility Statement
                </h1>
                
                <div className="prose prose-lg text-gray-700 leading-relaxed space-y-6">
                  <p>
                    Fetterman's is committed to making our website accessible to everyone, including people with disabilities.
                  </p>
                  
                  <p>
                    We are actively working to ensure our website meets the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.
                  </p>
                  
                  <p>
                    If you experience difficulty accessing content on our site or need assistance, please contact us at:
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-6 mt-8 border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Contact Information
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Mail className="w-5 h-5 text-emerald-700" aria-hidden="true" />
                        </div>
                        <div>
                          <span className="sr-only">Email:</span>
                          <a 
                            href="mailto:fettermansdeli@gmail.com"
                            className="text-emerald-700 hover:text-emerald-800 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded"
                            aria-label="Send email to fettermansdeli@gmail.com"
                          >
                            fettermansdeli@gmail.com
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Phone className="w-5 h-5 text-emerald-700" aria-hidden="true" />
                        </div>
                        <div>
                          <span className="sr-only">Phone:</span>
                          <a 
                            href="tel:+18165036757"
                            className="text-emerald-700 hover:text-emerald-800 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded"
                            aria-label="Call (816) 503-6757"
                          >
                            (816) 503-6757
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="mt-8">
                    We appreciate your feedback as we continue to improve the accessibility and usability of our website.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPage;