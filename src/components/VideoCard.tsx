import React, { useState } from 'react';
import { Download, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface VideoFormat {
    id: string;
    ext: string;
    resolution: string;
    filesize?: number;
}

interface VideoInfo {
    title: string;
    thumbnail: string;
    formats: VideoFormat[];
}

interface VideoCardProps {
    info: VideoInfo;
    url: string;
}

const VideoCard: React.FC<VideoCardProps> = ({ info, url }) => {
    const [downloading, setDownloading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [mode, setMode] = useState<'video' | 'audio'>('video');
    const [audioFormat, setAudioFormat] = useState<'mp3' | 'wav'>('mp3');
    const [container, setContainer] = useState('mp4');
    const [selectedFormat, setSelectedFormat] = useState('');

    const handleDownload = async () => {
        setDownloading(true);
        setStatus('idle');
        try {
            await axios.post('http://localhost:3001/api/download', {
                url,
                formatId: selectedFormat,
                mode,
                audioFormat,
                container
            });
            setStatus('success');
            // In a real app we would track progress here
        } catch (error) {
            console.error(error);
            setStatus('error');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mt-8 p-6 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 aspect-video rounded-lg overflow-hidden shadow-lg">
                    <img
                        src={info.thumbnail}
                        alt={info.title}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">{info.title}</h2>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-full border border-purple-500/20">
                                Max Quality
                            </span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex bg-gray-800/50 rounded-lg p-1 mb-4">
                            <button
                                onClick={() => setMode('video')}
                                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${mode === 'video' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Video
                            </button>
                            <button
                                onClick={() => setMode('audio')}
                                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${mode === 'audio' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Audio
                            </button>
                        </div>

                        {mode === 'video' ? (
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">Max Quality</label>
                                    <select
                                        className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                        value={selectedFormat}
                                        onChange={(e) => setSelectedFormat(e.target.value)}
                                    >
                                        <option value="">Best Available (4K/8K)</option>
                                        {info.formats.map((f: any) => (
                                            <option key={f.id} value={f.id}>
                                                {f.resolution} - {f.ext}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs text-gray-500 mb-1">Container</label>
                                    <select
                                        className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                        value={container}
                                        onChange={(e) => setContainer(e.target.value)}
                                    >
                                        <option value="mp4">MP4</option>
                                        <option value="mkv">MKV</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setAudioFormat('mp3')}
                                    className={`flex-1 py-1.5 border rounded-md text-xs font-medium transition-all ${audioFormat === 'mp3' ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}
                                >
                                    MP3
                                </button>
                                <button
                                    onClick={() => setAudioFormat('wav')}
                                    className={`flex-1 py-1.5 border rounded-md text-xs font-medium transition-all ${audioFormat === 'wav' ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}
                                >
                                    WAV
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-2">
                        <button
                            onClick={handleDownload}
                            disabled={downloading || status === 'success'}
                            className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${status === 'success'
                                ? 'bg-green-500 text-white'
                                : status === 'error'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white text-gray-900 hover:bg-gray-100'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {downloading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                                    Downloading...
                                </>
                            ) : status === 'success' ? (
                                <>
                                    <Check className="w-5 h-5" />
                                    Downloaded!
                                </>
                            ) : status === 'error' ? (
                                <>
                                    <AlertCircle className="w-5 h-5" />
                                    Failed
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    {mode === 'video' ? 'Download Video' : `Download ${audioFormat.toUpperCase()}`}
                                </>
                            )}
                        </button>
                        {status === 'success' && (
                            <div className="mt-4 flex flex-col gap-2">
                                <p className="text-center text-green-400 text-sm">
                                    Downloaded successfully!
                                </p>
                                <button
                                    onClick={() => {
                                        axios.post('http://localhost:3001/api/reveal', {
                                            path: 'downloads'
                                        });
                                    }}
                                    className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors border border-gray-700"
                                >
                                    Open Download Folder
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCard;
