// [EDIT] - 2024-01-15 - Created HomePage component - Ediens Team
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { 
  MapPin, 
  Heart, 
  Users, 
  Leaf, 
  Star, 
  Shield, 
  Clock, 
  Globe,
  ArrowRight,
  Play,
  CheckCircle
} from 'lucide-react';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();

  const features = [
    {
      icon: MapPin,
      title: 'Local Food Discovery',
      description: 'Find fresh food near you with our interactive map and location-based search.',
      color: 'text-primary-500'
    },
    {
      icon: Heart,
      title: 'Community Sharing',
      description: 'Connect with neighbors to share leftover food and reduce waste together.',
      color: 'text-secondary-500'
    },
    {
      icon: Leaf,
      title: 'Eco-Friendly',
      description: 'Earn eco points for every food item saved and contribute to sustainability.',
      color: 'text-success-500'
    },
    {
      icon: Shield,
      title: 'Safe & Trusted',
      description: 'Verified users and rating system ensure safe food sharing experiences.',
      color: 'text-warning-500'
    },
    {
      icon: Clock,
      title: 'Real-Time Updates',
      description: 'Get instant notifications about new food posts and claim opportunities.',
      color: 'text-accent-500'
    },
    {
      icon: Users,
      title: 'Business Integration',
      description: 'Restaurants and shops can post surplus food at discounted prices.',
      color: 'text-blue-500'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Food Items Shared' },
    { number: '5,000+', label: 'Active Users' },
    { number: '50+', label: 'Cities Covered' },
    { number: '2,000+', label: 'Kg Food Saved' }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Post Food',
      description: 'Share your leftover food with photos, descriptions, and pickup details.',
      icon: '🍽️'
    },
    {
      step: 2,
      title: 'Discover & Claim',
      description: 'Browse nearby food offers and claim items you want.',
      icon: '🔍'
    },
    {
      step: 3,
      title: 'Coordinate Pickup',
      description: 'Message the food owner and arrange pickup time and location.',
      icon: '💬'
    },
    {
      step: 4,
      title: 'Enjoy & Rate',
      description: 'Pick up your food and rate the experience to help others.',
      icon: '⭐'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Share Food,
              <span className="text-gradient block">Save the Planet</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with your community to share leftover food, reduce waste, and build a more sustainable future in Latvia.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/register"
                    className="btn-primary btn-lg text-lg px-8 py-4"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    to="/how-it-works"
                    className="btn-outline btn-lg text-lg px-8 py-4"
                  >
                    Learn How It Works
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/create-post"
                    className="btn-primary btn-lg text-lg px-8 py-4"
                  >
                    Share Food Now
                  </Link>
                  <Link
                    to="/map"
                    className="btn-outline btn-lg text-lg px-8 py-4"
                  >
                    Browse Food
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary-200 rounded-full opacity-20 animate-bounce-gentle"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-secondary-200 rounded-full opacity-20 animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-accent-200 rounded-full opacity-20 animate-bounce-gentle" style={{ animationDelay: '2s' }}></div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Ediens Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              It's simple! Share your leftover food and help others discover delicious meals while reducing waste.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-3xl mx-auto group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Ediens?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're building the future of sustainable food sharing with cutting-edge features and a focus on community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-soft hover:shadow-large transition-shadow duration-300">
                <div className={`w-12 h-12 ${feature.color} mb-6`}>
                  <feature.icon className="w-full h-full" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of Latvians who are already sharing food and building a more sustainable community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/register"
                  className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200"
                >
                  Start Sharing Today
                </Link>
                <Link
                  to="/about"
                  className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200"
                >
                  Learn More
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/create-post"
                  className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200"
                >
                  Share More Food
                </Link>
                <Link
                  to="/invite-friends"
                  className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200"
                >
                  Invite Friends
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Community Says
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hear from real users who are making a difference with Ediens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Anna Bērziņa',
                role: 'Home Cook',
                city: 'Riga',
                content: 'I love sharing my extra bread and vegetables. It feels great to know nothing goes to waste!',
                rating: 5
              },
              {
                name: 'Jānis Ozols',
                role: 'Restaurant Owner',
                city: 'Daugavpils',
                content: 'Ediens helps us reduce food waste and connect with our community. Win-win!',
                rating: 5
              },
              {
                name: 'Māra Kalniņa',
                role: 'Student',
                city: 'Liepāja',
                content: 'As a student, I save money and help the environment. The app is so easy to use!',
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role} • {testimonial.city}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Join the Food Sharing Revolution
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Together, we can create a more sustainable Latvia where no good food goes to waste.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Get Started'}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <div className="flex items-center space-x-4 text-sm opacity-75">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-success-400" />
                <span>Free to use</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-success-400" />
                <span>Safe & secure</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-success-400" />
                <span>Community driven</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;