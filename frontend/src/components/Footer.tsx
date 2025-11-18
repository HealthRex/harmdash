'use client';

const Footer = () => {
  return (
    <footer className="bg-white ">
      <div className="max-w-7xl py-8 px-6 md:py-12 md:px-8 mx-auto">

        {/* as Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-4 lg:grid-cols-4 justify-items-start mb-16 gap-8 lg:gap-32 sm:justify-items-start md:justify-items-start lg:justify-items-start">
          {/* Logo and Intro */}
          <div className='ml-2'>
            <h4 className="text-sm font-medium text-gray-400 mb-4 tracking-wide">Navigation</h4>
            <ul className="space-y-2 mt-[1.4rem]">
              <li><a href="https://www.arise-ai.org/blog" className="text-sm text-gray-700 hover:text-black transition-colors">Blog</a></li>
              <li><a href="https://www.arise-ai.org/research" className="text-sm text-gray-700 hover:text-black transition-colors">Research</a></li>
              <li><a href="https://www.arise-ai.org/news" className="text-sm text-gray-700 hover:text-black transition-colors">News</a></li>
            </ul>
          </div>

          {/* More */}
          <div className='ml-2'>
            <h4 className="text-sm font-medium text-gray-400 mb-4 tracking-wide">Explore</h4>
            <ul className="space-y-2 mt-[1.3rem]">
              <li><a href="https://www.arise-ai.org/about" className="text-sm text-gray-700 hover:text-black transition-colors">About</a></li>
              <li><a href="https://www.arise-ai.org/team" className="text-sm text-gray-700 hover:text-black transition-colors">People</a></li>
              <li><a href="https://www.arise-ai.org/events" className="text-sm text-gray-700 hover:text-black transition-colors">Events</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <span className="text-gray-500 text-sm">Arise © 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">English</span>
              <span className="text-gray-500 text-sm">United States</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
