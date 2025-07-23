import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react';

interface FooterProps {
  id?: string;
}

const Footer: React.FC<FooterProps> = ({ id }) => {
  return (
    <footer id={id} className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/Fettermans_Logo.png" 
                alt="Fetterman's Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="font-display font-bold text-xl">Fetterman's</span>
            </div>
            <p className="text-gray-300 text-sm">
              Your premier destination for delicious food and exceptional dining experiences. 
              Fresh ingredients, bold flavors, and convenient pickup options.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.facebook.com/fettermans" 
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Visit our Facebook page"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="w-5 h-5" aria-hidden="true" />
              </a>
              <a 
                href="https://x.com/FettermansDeli" 
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Visit our Twitter page"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="w-5 h-5" aria-hidden="true" />
              </a>
              <a 
                href="https://www.instagram.com/fettermans_deli" 
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Visit our Instagram page"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <nav className="space-y-2" aria-label="Footer navigation">
              <Link to="/" className="block text-gray-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link to="/products" className="block text-gray-300 hover:text-white transition-colors">
                Menu
              </Link>
              <Link to="/about" className="block text-gray-300 hover:text-white transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="block text-gray-300 hover:text-white transition-colors">
                Contact
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-primary-400" aria-hidden="true" />
                <div className="space-y-1">
                  <a 
                    href="mailto:fettermanscreekside@gmail.com" 
                    className="block text-gray-300 hover:text-white text-sm transition-colors"
                    aria-label="Send email to Creekside location"
                  >
                    fettermanscreekside@gmail.com
                  </a>
                  <a 
                    href="mailto:fettermansplattecity@gmail.com" 
                    className="block text-gray-300 hover:text-white text-sm transition-colors"
                    aria-label="Send email to Platte City location"
                  >
                    fettermansplattecity@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex justify-center">
            <p className="text-gray-300 text-sm">
              © 2025 Fetterman's. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;