import React, { useEffect, useState } from 'react';
import { Routes, Route, BrowserRouter, Link } from 'react-router-dom';
import axios from 'axios';
import { Github, Twitter, Mail, Code2, Layers, Coffee, PawPrint, GraduationCap, Star, Heart, Zap } from 'lucide-react';
import ChinaMap from './components/ChinaMap';
import Admin from './Admin';
import { Post, Location, Settings, Attribute } from './types';
import { format } from 'date-fns';

const IconMap: Record<string, React.ElementType> = {
  Code2, Layers, Coffee, PawPrint, GraduationCap, Star, Heart, Zap
};

function Home() {
  const [settings, setSettings] = useState<Settings>({
    name: '...',
    title: '...',
    description: '...',
    avatar_url: '',
    github_url: '',
    twitter_url: '',
    email: '',
    footer_text: 'CM DESIGN LAB',
    footer_subtitle: 'Designed with intent. Built for the future.',
    footer_copyright: '© 2026 .... All rights reserved.',
    map_title: '足迹·FOOTPRINTS',
    map_subtitle: '走遍大江南北',
    map_unit: '点亮城市',
    stat_1_label: '坐标',
    stat_1_value: '地球',
    stat_2_label: '经验',
    stat_2_value: '持续迭代中',
    stat_3_label: '状态',
    stat_3_value: '开放合作',
    blog_title: '博客片段 · BLOG',
    favicon_url: '',
    bg_image_url: '',
    bg_blur: 'none'
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const fetchData = async () => {
    try {
      const [setsRes, locsRes, postsRes, attrsRes] = await Promise.allSettled([
        axios.get('/api/settings'),
        axios.get('/api/locations'),
        axios.get('/api/posts'),
        axios.get('/api/attributes')
      ]);

      if (setsRes.status === 'fulfilled') {
        const data = setsRes.value.data;
        setSettings(prev => ({ ...prev, ...data }));
        if (data.favicon_url) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = data.favicon_url;
        }
      }
      if (locsRes.status === 'fulfilled') setLocations(locsRes.value.data);
      if (postsRes.status === 'fulfilled') setPosts(postsRes.value.data);
      if (attrsRes.status === 'fulfilled') setAttributes(attrsRes.value.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePostClick = async (post: Post) => {
    setSelectedPost(post);
    // Increment view
    try {
      await axios.post(`/api/posts/${post.id}/view`);
      fetchData(); // Refetch to get updated views
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a]"></div>;
  }

  return (
    <div className="min-h-screen text-neutral-200 font-sans p-6 sm:p-10 selection:bg-white/20 relative z-0">
      {/* Background Layer */}
      {settings.bg_image_url ? (
        <div 
          className="fixed inset-0 min-h-screen min-w-full z-[-1] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${settings.bg_image_url})` }}
        >
          <div className={`absolute inset-0 bg-black/50 ${settings.bg_blur === 'glass' ? 'backdrop-blur-3xl' : ''}`}></div>
        </div>
      ) : (
        <div className="fixed inset-0 min-h-screen min-w-full z-[-1] bg-[#0a0a0a]"></div>
      )}

      {/* Modal Profile Card */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md transition-all" onClick={() => setSelectedPost(null)}>
          <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar p-10 flex flex-col relative" onClick={e => e.stopPropagation()}>
             <button onClick={() => setSelectedPost(null)} className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors">✕</button>
             <h2 className="text-3xl font-medium text-white mb-4">{selectedPost.title}</h2>
             <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 mb-8 border-b border-white/10 pb-6">
                <span>{format(new Date(selectedPost.created_at), 'yyyy/MM/dd')}</span>
                <span>VIEWS: {selectedPost.views + 1}</span>
             </div>
             {selectedPost.image_url && (
                <div className="mb-8 rounded-2xl overflow-hidden w-full max-h-80 relative flex items-center justify-center bg-black/40">
                  <img src={selectedPost.image_url} alt={selectedPost.title} className="max-w-full max-h-[20rem] object-contain rounded-2xl border border-white/5" />
                </div>
             )}
             <div className="text-neutral-300 leading-loose text-base whitespace-pre-wrap">{selectedPost.content}</div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[3fr_5fr_3fr] gap-6">
        
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Profile Card */}
          <div className="gemini-card isolate group cursor-default">
            <div className="bg-[#0a0a0a] group-hover:bg-transparent group-hover:backdrop-blur-[40px] rounded-[32px] p-8 flex flex-col items-center justify-center overflow-hidden transition-all duration-700 h-full w-full">
              <div className="w-24 h-24 rounded-full bg-neutral-900 border border-white/10 overflow-hidden mb-6 flex items-center justify-center z-10 transition-transform duration-500 group-hover:scale-105">
                {settings.avatar_url ? (
                  <img src={settings.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-neutral-600 text-sm">无头像</span>
                )}
              </div>
              
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2 z-10">{settings.name || 'Alex'}</h1>
              <h2 className="text-blue-400 font-medium mb-6 z-10">{settings.title || '全栈开发者 / 探索者'}</h2>
              
              <p className="text-center text-sm text-neutral-400 leading-relaxed max-w-[200px] z-10">
                {settings.description || '探索代码与设计的边界，热衷于构建具有温度的数字产品。'}
              </p>
            </div>
          </div>

          {/* Attributes Card */}
          <div className="bg-white/[0.015] border border-white/[0.05] rounded-[32px] p-8 transition-all duration-500 hover:bg-white/[0.02]">
            <h3 className="text-xs text-neutral-500 mb-8 tracking-widest font-mono">个人属性</h3>
            <div className="space-y-6">
              {attributes.length > 0 ? attributes.map(attr => {
                const IconComp = IconMap[attr.icon] || Code2;
                return (
                  <div key={attr.id} className="flex items-start gap-4">
                    <IconComp className="w-5 h-5 text-purple-400 mt-1 shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-white mb-1">{attr.title}</h4>
                      <p className="text-xs text-neutral-500 leading-relaxed">{attr.description}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-xs text-neutral-500">（可在后台添加属性）</div>
              )}
            </div>
          </div>

          {/* Socials Row */}
          <div className="grid grid-cols-3 gap-4">
            <a href={settings.github_url || '#'} target="_blank" rel="noreferrer" className="bg-white/[0.015] border border-white/[0.05] rounded-[24px] p-5 flex items-center justify-center transition-all duration-300 hover:bg-white/[0.04] hover:scale-[1.02]">
              <Github className="w-5 h-5 text-neutral-400" />
            </a>
            <a href={settings.twitter_url || '#'} target="_blank" rel="noreferrer" className="bg-white/[0.015] border border-white/[0.05] rounded-[24px] p-5 flex items-center justify-center transition-all duration-300 hover:bg-white/[0.04] hover:scale-[1.02]">
              <Twitter className="w-5 h-5 text-neutral-400" />
            </a>
            <a href={settings.email ? `mailto:${settings.email}` : '#'} className="bg-white/[0.015] border border-white/[0.05] rounded-[24px] p-5 flex items-center justify-center transition-all duration-300 hover:bg-white/[0.04] hover:scale-[1.02]">
              <Mail className="w-5 h-5 text-neutral-400" />
            </a>
          </div>
        </div>


        {/* Center Column */}
        <div className="flex flex-col gap-6">
          {/* Map Card */}
          <div className="bg-white/[0.015] border border-white/[0.05] rounded-[32px] p-8 flex-1 flex flex-col relative transition-all duration-500 hover:bg-white/[0.02]">
            <div className="mb-2">
              <h2 className="text-2xl font-light text-white tracking-wide">{settings.map_title || '足迹·FOOTPRINTS'}</h2>
              <p className="text-blue-500/80 text-sm font-medium">{settings.map_subtitle || '走遍大江南北'}</p>
            </div>
            
            <div className="flex-1 min-h-[400px] w-full mt-4 filter drop-shadow-lg">
              {/* Echarts Component */}
              <ChinaMap locations={locations} />
            </div>

            <div className="absolute right-8 bottom-8 text-right">
              <div className="text-4xl font-semibold text-white tracking-tighter">{locations.length}</div>
              <div className="text-xs text-neutral-500 uppercase tracking-widest font-mono mt-1">{settings.map_unit || '点亮城市'}</div>
            </div>
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-3 gap-4">
             <div className="bg-white/[0.015] border border-white/[0.05] rounded-[24px] p-6 text-center transition-all duration-500 hover:bg-white/[0.02]">
                <div className="text-xs text-neutral-500 mb-2">{settings.stat_1_label || '坐标'}</div>
                <div className="text-sm text-white font-medium">{settings.stat_1_value || '地球'}</div>
             </div>
             <div className="bg-white/[0.015] border border-white/[0.05] rounded-[24px] p-6 text-center transition-all duration-500 hover:bg-white/[0.02]">
                <div className="text-xs text-neutral-500 mb-2">{settings.stat_2_label || '经验'}</div>
                <div className="text-sm text-white font-medium">{settings.stat_2_value || '持续迭代中'}</div>
             </div>
             <div className="bg-white/[0.015] border border-white/[0.05] rounded-[24px] p-6 text-center transition-all duration-500 hover:bg-white/[0.02]">
                <div className="text-xs text-neutral-500 mb-2">{settings.stat_3_label || '状态'}</div>
                <div className="text-sm font-medium text-blue-400">{settings.stat_3_value || '开放合作'}</div>
             </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Blog Logs */}
          <div className="bg-white/[0.015] border border-white/[0.05] rounded-[32px] p-8 flex-1 transition-all duration-500 hover:bg-white/[0.02] flex flex-col">
            <h3 className="text-xs text-neutral-500 mb-6 tracking-widest font-mono">{settings.blog_title || '博客片段 · BLOG'}</h3>
            
            <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              {posts.map(post => (
                <div 
                  key={post.id} 
                  className="group cursor-pointer border-b border-white/[0.05] pb-6 last:border-0 last:pb-0"
                  onClick={() => handlePostClick(post)}
                >
                  <h4 className="text-base font-medium text-neutral-200 group-hover:text-white transition-colors mb-2">{post.title}</h4>
                  <p className="text-sm text-neutral-500 line-clamp-2 leading-relaxed mb-4">{post.content}</p>
                  <div className="flex items-center justify-between text-[11px] text-neutral-600 font-mono">
                    <span>{format(new Date(post.created_at), 'yyyy/M/d')}</span>
                    <span className="flex items-center gap-1">浏览量: {post.views}</span>
                  </div>
                </div>
              ))}
              {posts.length === 0 && (
                <div className="text-center text-sm text-neutral-600 mt-10">暂无文章</div>
              )}
            </div>
          </div>

          {/* Footer Branding */}
          <div className="bg-[#111111] border border-white/[0.05] rounded-[32px] p-8 flex flex-col items-center justify-center text-center transition-all duration-500 hover:bg-white/[0.02]">
             <h3 className="text-sm font-bold tracking-[0.2em] text-white mb-4 uppercase">{settings.footer_text || 'CM DESIGN LAB'}</h3>
             <p className="text-xs text-neutral-500 font-serif italic max-w-[#200px] mb-8">{settings.footer_subtitle || 'Designed with intent. Built for the future.'}</p>
             <p className="text-[10px] text-neutral-600">{settings.footer_copyright || `© 2026 ${settings.name || '...'}. All rights reserved.`}</p>
             <Link to="/admin" className="text-[10px] text-neutral-700 hover:text-neutral-500 mt-4 underline decoration-white/10 underline-offset-4">Admin Dashboard</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
