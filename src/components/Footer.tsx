import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Mail, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import CookiePolicyModal from './CookiePolicyModal';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import TermsOfServiceModal from './TermsOfServiceModal';

export default function Footer() {
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <img 
                src="/ClearlotLogov2.png" 
                alt="ClearLot" 
                className="h-8 w-auto"
              />
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              專業的B2B清倉交易平台。
              連接優質供應商與企業買家，創造雙贏的商業機會。
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">關於我們</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/hk/browse-offers" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 group relative"
                  title="需要註冊才能瀏覽優惠"
                >
                  瀏覽優惠
                  <span className="absolute -bottom-6 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    需要註冊才能瀏覽
                  </span>
                </Link>
              </li>
              <li><Link to="/hk/how-it-works" className="text-gray-300 hover:text-white transition-colors duration-200">運作方式</Link></li>
              <li><Link to="/hk/become-seller" className="text-gray-300 hover:text-white transition-colors duration-200">成為賣家</Link></li>
              <li><Link to="/hk/help-center" className="text-gray-300 hover:text-white transition-colors duration-200">幫助中心</Link></li>
            </ul>
          </div>



          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6">聯絡我們</h3>
            <div className="space-y-4">
              <div className="flex items-center text-gray-300">
                <Mail className="h-5 w-5 mr-3 text-blue-400" />
                <span>support@clearlot.app</span>
              </div>
              <div className="flex items-start text-gray-300">
                <MapPin className="h-5 w-5 mr-3 mt-1 text-blue-400" />
                <span>Flat E10, 13/F, Block E, Tsing Yi Industrial Centre, Phase 2, Tsing Yi, NT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 ClearLot. 版權所有。
            </div>
            <div className="flex space-x-6 text-sm">
              <button 
                onClick={() => setShowPrivacyModal(true)}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                私隱政策
              </button>
              <button 
                onClick={() => setShowTermsModal(true)}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                服務條款
              </button>
              <button 
                onClick={() => setShowCookieModal(true)}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                Cookie政策
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <CookiePolicyModal 
        isOpen={showCookieModal} 
        onClose={() => setShowCookieModal(false)} 
      />
      <PrivacyPolicyModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
      />
      <TermsOfServiceModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
      />
    </footer>
  );
}