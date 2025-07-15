import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Award, Users, Shield, Star, Clock, ExternalLink, Coffee, Sandwich } from 'lucide-react';

const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const stats = [
    { label: 'Years in Food Industry', value: '25+', icon: Star },
    { label: 'Years of Experience', value: '20+', icon: Award },
    { label: 'Community Members Served', value: 'Thousands', icon: Users },
    { label: 'Quality Commitment', value: '100%', icon: Heart }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Community Connection',
      description: 'We believe in creating a sense of community where friends and family can come together to meet and enjoy themselves. Every customer is family to us.'
    },
    {
      icon: Shield,
      title: 'Boar\'s Head Quality',
      description: 'We exclusively serve Boar\'s Head meats and cheeses - simply the best quality deli products you can get, trusted since 1905.'
    },
    {
      icon: Sandwich,
      title: 'Artisan Craftsmanship',
      description: 'Every sandwich is made with passion and precision. From our famous Reuben to custom creations, we take pride in every bite.'
    },
    {
      icon: Coffee,
      title: 'Expanding Horizons',
      description: 'From specialty coffee to kombucha on tap, we\'re constantly growing to serve our community better with quality beverages and expanded offerings.'
    }
  ];

  const team = [
    {
      name: 'Scott Fetterman',
      role: 'Founder & Owner',
      image: '/Fettermans_Logo.png',
      bio: 'A passionate deli enthusiast with 25+ years in the food and beverage industry. Scott\'s dream began at age 16 working at Legrand\'s Market, and he opened Fetterman\'s Deli in December 2020 to create a community gathering place.'
    },
    {
      name: 'Kassie Fetterman',
      role: 'Co-Owner',
      image: '/Fettermans_Logo.png',
      bio: 'Supporting the family business and helping create the welcoming atmosphere that makes Fetterman\'s feel like home for every customer who walks through our doors.'
    },
    {
      name: 'The Fetterman Family',
      role: 'Heart of the Business',
      image: '/Fettermans_Logo.png',
      bio: 'Nick, Will, and Luke Fetterman - the next generation who inspire us to build something lasting for our Platte City community.'
    }
  ];

  const newsArticles = [
    {
      title: 'Fetterman\'s Deli Opens in Platte City',
      publication: 'The Platte County Citizen',
      description: 'Local coverage of our grand opening and Scott\'s journey from dream to reality.',
      url: 'https://www.plattecountycitizen.com/theplattecountycitizen/fettermans-deli-opens-in-platte-city1422023',
      date: 'January 2023'
    },
    {
      title: 'Fetterman\'s Featured in Business Journal',
      publication: 'Kansas City Business Journal',
      description: 'Recognition of our growth and community impact in the Kansas City metro area.',
      url: 'https://www.bizjournals.com/kansascity/news/2024/01/09/fettermans-betty-raes-ice-cream-scott-fetterman.html',
      date: 'January 2024'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About Fetterman's Deli
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              A family-owned deli in Platte City, Missouri, where community comes first and every sandwich is made with passion. 
              Serving the finest Boar's Head meats and cheeses since December 2020.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-emerald-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-white text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Scott Fetterman's journey began at age 16, working at Legrand's Market where his passion for the food industry was born. 
                  With over 25 years of experience in food and beverage, Scott's dream of opening his own deli became reality in December 2020.
                </p>
                <p>
                  Located in the heart of Platte City, Missouri, Fetterman's Deli was created as more than just a restaurant - 
                  it's a community gathering place where friends and family can come together to meet and enjoy themselves. 
                  We believe every customer is family.
                </p>
                <p>
                  From our famous Reuben sandwiches made with premium Boar's Head meats and cheeses to our expanding offerings 
                  including specialty coffee and kombucha on tap, we're constantly growing to serve our community better. 
                  Our commitment to quality and creating connections drives everything we do.
                </p>
              </div>
            </div>
            <div className="lg:order-first">
              <img 
                src="/Fettermans_Logo.png" 
                alt="Fetterman's Deli" 
                className="rounded-lg shadow-lg w-full h-96 object-contain bg-white p-8"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These core principles guide everything we do and shape the experience we create for our customers.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6 group-hover:bg-emerald-200 transition-colors">
                    <IconComponent className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The passionate people behind Fetterman's who work every day to make great food accessible and enjoyable.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <img
                  src={member.image}
                  alt={`${member.name}, ${member.role} at Fetterman's Deli`}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-contain bg-white p-2"
                />
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* News & Recognition Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">In the News</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              See what the community is saying about Fetterman's Deli.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {newsArticles.map((article, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{article.title}</h3>
                    <p className="text-emerald-700 font-semibold text-sm">{article.publication}</p>
                  </div>
                  <div className="text-gray-600 text-sm font-medium">
                     {article.date}
                   </div>
                </div>
                <p className="text-gray-600 mb-4 leading-relaxed">{article.description}</p>
                <a
                   href={article.url}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="inline-flex items-center text-emerald-700 hover:text-emerald-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded"
                   aria-label={`Read article: ${article.title} from ${article.publication}`}
                 >
                   Read Article
                   <ExternalLink className="w-4 h-4 ml-1" aria-hidden="true" />
                 </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-emerald-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Experience Fetterman's?
          </h2>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
             Join our Platte City community and taste the difference that 25+ years of passion makes.
           </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <button 
               onClick={() => navigate('/products')}
               className="bg-white text-emerald-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-800"
             >
               Order Online
             </button>
             <button 
               onClick={() => navigate('/')}
               className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-800"
             >
               Visit Us Today
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;