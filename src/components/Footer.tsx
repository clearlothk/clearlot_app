import { Link } from 'react-router-dom';
import { TrendingUp, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <div className="bg-blue-600 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold">ClearLot</span>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              領先的B2B清倉交易平台。
              與認證供應商聯繫，發掘令人難以置信的節省機會。
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
            <h3 className="text-lg font-semibold mb-6">快速連結</h3>
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
              <div className="flex items-center text-gray-300">
                <Phone className="h-5 w-5 mr-3 text-blue-400" />
                <span>+852 98765432</span>
              </div>
              <div className="flex items-start text-gray-300">
                <MapPin className="h-5 w-5 mr-3 mt-1 text-blue-400" />
                <span>尖沙咀彌敦道123號<br />100室<br />九龍尖沙咀，香港</span>
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
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">私隱政策</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">服務條款</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Cookie政策</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}