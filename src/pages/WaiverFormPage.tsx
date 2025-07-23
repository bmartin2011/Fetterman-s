import React from 'react';
import { Download, FileText, Image, AlertCircle } from 'lucide-react';

const WaiverFormPage: React.FC = () => {
  const handleDownload = (fileName: string, fileType: 'pdf' | 'image') => {
    // In a real application, these would be actual file URLs
    // For now, we'll create placeholder download functionality
    const link = document.createElement('a');
    
    if (fileType === 'pdf') {
      // Actual PDF file path
      link.href = '/Hotdog-eating-contest-waiver-form.pdf';
      link.download = 'Hotdog-eating-contest-waiver-form.pdf';
    } else {
      // Actual image file path
      link.href = '/Fetterman\'s Sack Lunch Order Form.webp';
      link.download = 'Fettermans-Sack-Lunch-Order-Form.webp';
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Waiver & Forms
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Download the required forms and waivers for our special events and services.
            Please complete and return them as instructed.
          </p>
        </div>

        {/* Forms Grid */}
        <div className="grid md:grid-cols-1 gap-8 mb-12">
          {/* Sack Lunch Form */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mx-auto mb-4">
                <Image className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white text-center">
                Sack Lunch Program
              </h2>
              <p className="text-emerald-100 text-center mt-2">
                Order Form
              </p>
            </div>
            
            <div className="p-6 flex flex-col flex-grow">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Form Details:
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    Lunch selection options
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    Dietary restrictions section
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    Pickup time preferences
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    Contact information
                  </li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex-grow">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Please submit your completed form at least 24 hours in advance.
                      Orders are subject to availability.
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleDownload('sack-lunch-form.jpg', 'image')}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 mt-auto focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                aria-label="Download sack lunch form as image file"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
                <span>Download as Image</span>
              </button>
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How to Submit Your Forms
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Download</h3>
              <p className="text-gray-600 text-sm">
                Click the download buttons above to get the forms you need.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Complete</h3>
              <p className="text-gray-600 text-sm">
                Fill out all required information clearly and completely.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Submit</h3>
              <p className="text-gray-600 text-sm">
                Bring completed forms to our location or email them to us.
              </p>
            </div>
          </div>
          

        </div>
      </div>
    </div>
  );
};

export default WaiverFormPage;