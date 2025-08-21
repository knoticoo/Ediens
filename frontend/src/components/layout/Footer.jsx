// [EDIT] - 2024-01-15 - Created Footer component - Ediens Team
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  MapPin, 
  Mail, 
  Phone, 
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Linkedin
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { name: 'How it Works', href: '/how-it-works' },
      { name: 'Safety Guidelines', href: '/safety' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Support', href: '/support' },
    ],
    features: [
      { name: 'Food Sharing', href: '/features/sharing' },
      { name: 'Business Integration', href: '/features/business' },
      { name: 'Eco Points', href: '/features/eco-points' },
      { name: 'Delivery Options', href: '/features/delivery' },
    ],
    community: [
      { name: 'Success Stories', href: '/community/stories' },
      { name: 'Volunteer Program', href: '/community/volunteer' },
      { name: 'Partnerships', href: '/community/partnerships' },
      { name: 'Events', href: '/community/events' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/legal/privacy' },
      { name: 'Terms of Service', href: '/legal/terms' },
      { name: 'Cookie Policy', href: '/legal/cookies' },
      { name: 'Data Protection', href: '/legal/data-protection' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', href: 'https://facebook.com/ediens', icon: Facebook },
    { name: 'Instagram', href: 'https://instagram.com/ediens', icon: Instagram },
    { name: 'Twitter', href: 'https://twitter.com/ediens', icon: Twitter },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/ediens', icon: Linkedin },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🍽️</span>
              </div>
              <span className="text-xl font-bold">Ediens</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Connecting communities to reduce food waste and build a more sustainable future. 
              Share, discover, and save food together in Latvia.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-300">
                <MapPin className="w-4 h-4 text-primary-400" />
                <span>Riga, Latvia</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <Mail className="w-4 h-4 text-primary-400" />
                <a href="mailto:hello@ediens.lv" className="hover:text-white transition-colors">
                  hello@ediens.lv
                </a>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <Phone className="w-4 h-4 text-primary-400" />
                <a href="tel:+37120000000" className="hover:text-white transition-colors">
                  +371 20 000 000
                </a>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Platform</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Features</h3>
            <ul className="space-y-2">
              {footerLinks.features.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Community</h3>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="max-w-md">
            <h3 className="text-lg font-semibold mb-2 text-white">
              Stay Updated
            </h3>
            <p className="text-gray-300 mb-4">
              Get the latest news about food sharing and sustainability in Latvia.
            </p>
            <form className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-gray-400">
              <span>© {currentYear} Ediens. All rights reserved.</span>
              <span>•</span>
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>in Latvia</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>

            {/* Language Selector */}
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-gray-400" />
              <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors">
                <option value="lv">Latviešu</option>
                <option value="en">English</option>
                <option value="ru">Русский</option>
              </select>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="text-center text-gray-400 text-sm">
            <p className="mb-2">
              Ediens is committed to reducing food waste and building sustainable communities across Latvia.
            </p>
            <p>
              Partner with us to make a difference. 
              <a href="/partnerships" className="text-primary-400 hover:text-primary-300 ml-1 transition-colors">
                Learn more about our partnerships →
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;