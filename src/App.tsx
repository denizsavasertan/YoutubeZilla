import { useState } from 'react';
import axios from 'axios';
import SearchBar from './components/SearchBar';
import VideoCard from './components/VideoCard';
import logo from './assets/Logo.jpg';

interface VideoInfo {
  title: string;
  thumbnail: string;
  formats: any[];
}

function App() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async (url: string) => {
    setIsLoading(true);
    setError('');
    setVideoInfo(null);
    setCurrentUrl(url);

    try {
      const response = await axios.get(`http://localhost:3001/api/info?url=${encodeURIComponent(url)}`);
      setVideoInfo(response.data);
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to fetch video info. Please check the URL.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030114] flex flex-col items-center font-sans selection:bg-purple-500/30 overflow-hidden">
      {/* Draggable Title Bar */}
      <div className="w-full h-8 bg-[#030114] fixed top-0 left-0 z-50 flex items-center justify-end px-4 draggable-region">
        {/* Window controls are handled by OS in frameless mode, but we need drag area */}
      </div>

      <div className="z-10 w-full max-w-4xl text-center mb-8 pt-24">
        <img
          src={logo}
          alt="YoutubeZilla Logo"
          className="h-64 md:h-80 mx-auto rounded-2xl"
        />
        <p className="text-gray-400 text-lg mt-4 font-medium tracking-wide">
          Download YouTube videos in maximum resolution with purely raw power.
        </p>
      </div>

      <div className="z-10 w-full">
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />

        {error && (
          <div className="max-w-2xl mx-auto mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center">
            {error}
          </div>
        )}

        {videoInfo && (
          <VideoCard info={videoInfo} url={currentUrl} />
        )}
      </div>

      <div className="mt-auto py-6 text-gray-600 text-sm">
        Running locally on port 3001
      </div>
    </div>
  );
}

export default App;
