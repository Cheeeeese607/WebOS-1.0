import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Location, Post, Attribute } from './types';
import toast, { Toaster } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [password, setPassword] = useState('');
  
  const [settings, setSettings] = useState<Settings>({
    name: '', title: '', description: '',
    avatar_url: '', github_url: '', twitter_url: '',
    email: '', footer_text: '',
    map_title: '', map_subtitle: '', map_unit: '',
    stat_1_label: '', stat_1_value: '',
    stat_2_label: '', stat_2_value: '',
    stat_3_label: '', stat_3_value: '',
    blog_title: '',
    favicon_url: '',
    bg_image_url: '',
    bg_blur: 'none'
  });
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  
  const [newLoc, setNewLoc] = useState({ name: '', longitude: '', latitude: '', description: '', date: '', type: 'travel' });
  const [newPost, setNewPost] = useState({ title: '', content: '', image_url: '' });
  const [newAttr, setNewAttr] = useState({ title: '', description: '', icon: 'Code2' });
  const [newPassword, setNewPassword] = useState('');

  const fetchAdminData = async () => {
    try {
      const [setsRes, locsRes, postsRes, attrsRes] = await Promise.all([
        axios.get('/api/settings'),
        axios.get('/api/locations'),
        axios.get('/api/posts'),
        axios.get('/api/attributes')
      ]);
      setSettings(prev => ({ ...prev, ...setsRes.data }));
      setLocations(locsRes.data);
      setPosts(postsRes.data);
      setAttributes(attrsRes.data);
    } catch (e) {
      toast.error('数据获取失败');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return toast.error('新密码不能为空');
    try {
      await axios.post('/api/change-password', { newPassword });
      toast.success('密码已成功修改。');
      setNewPassword('');
    } catch (e: any) {
      toast.error(e.response?.data?.error || '修改密码失败');
    }
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchAdminData();
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/login', { password });
      if (res.data.success) {
        setToken(res.data.token);
        localStorage.setItem('adminToken', res.data.token);
        toast.success('登录成功');
      }
    } catch (e) {
      toast.error('密码错误');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.name) return toast.error('姓名为必填项');
    try {
      await axios.post('/api/settings', settings);
      toast.success('设置已保存');
    } catch (e) {
      toast.error('设置保存失败');
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoc.name || !newLoc.longitude || !newLoc.latitude) return toast.error('名称和坐标为必填项');
    try {
      await axios.post('/api/locations', {
        ...newLoc,
        longitude: parseFloat(newLoc.longitude),
        latitude: parseFloat(newLoc.latitude)
      });
      toast.success('足迹已添加');
      setNewLoc({ name: '', longitude: '', latitude: '', description: '', date: '', type: 'travel' });
      fetchAdminData();
    } catch (e) {
      toast.error('添加足迹失败');
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content) return toast.error('标题和内容为必填项');
    try {
      await axios.post('/api/posts', newPost);
      toast.success('文章已发布');
      setNewPost({ title: '', content: '', image_url: '' });
      fetchAdminData();
    } catch (e) {
      toast.error('发布文章失败');
    }
  };

  const handleAddAttr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttr.title) return toast.error('标题为必填项');
    try {
      await axios.post('/api/attributes', newAttr);
      toast.success('属性已创建');
      setNewAttr({ title: '', description: '', icon: 'Code2' });
      fetchAdminData();
    } catch (e) {
      toast.error('创建属性失败');
    }
  };

  const deleteLocation = async (id: number) => {
    if (!window.confirm('确认删除该足迹？')) return;
    try {
      await axios.delete(`/api/locations/${id}`);
      fetchAdminData();
    } catch (e) {
      toast.error('删除足迹失败');
    }
  };

  const deletePost = async (id: number) => {
    if (!window.confirm('确认删除该文章？')) return;
    try {
      await axios.delete(`/api/posts/${id}`);
      fetchAdminData();
    } catch (e) {
      toast.error('删除文章失败');
    }
  };

  const deleteAttr = async (id: number) => {
    if (!window.confirm('确认删除该属性？')) return;
    try {
      await axios.delete(`/api/attributes/${id}`);
      fetchAdminData();
    } catch (e) {
      toast.error('删除属性失败');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-sans">
        <Toaster />
        <form onSubmit={handleLogin} className="bg-[#111] border border-white/[0.05] shadow-2xl p-8 rounded-3xl w-full max-w-sm text-center">
           <h2 className="text-xl text-white font-medium mb-8">后台管理登录</h2>
           <input 
             type="password" 
             value={password}
             onChange={e => setPassword(e.target.value)}
             className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 focus:bg-black/60 focus:ring-1 focus:ring-blue-500/50 transition-all mb-6 text-center"
             placeholder="请输入密码"
           />
           <button type="submit" className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition-colors shadow-lg">
             登 录
           </button>
           <div className="mt-6 text-xs text-neutral-500">初始默认密码: admin123</div>
        </form>
      </div>
    );
  }

  const inputClass = "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 focus:bg-black/60 focus:ring-1 focus:ring-blue-500/50 transition-all";
  const labelClass = "block text-xs text-neutral-400 font-medium mb-1.5 ml-1";
  const btnClass = "w-full mt-6 bg-white text-black font-semibold py-2.5 rounded-xl hover:bg-neutral-200 transition-colors shadow-lg text-sm";
  const btnSecondaryClass = "w-full bg-white/5 border border-white/10 text-white font-medium py-2.5 rounded-xl hover:bg-white/10 transition-all text-sm mt-4";
  const listWrapperClass = "flex items-center justify-between p-3.5 bg-black/20 border border-white/[0.05] rounded-xl text-sm hover:bg-black/40 transition-colors";

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 font-sans p-6 md:p-10">
      <Toaster />
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/10">
          <h1 className="text-3xl font-bold text-white tracking-tight">控制台</h1>
          <div className="flex items-center gap-6">
             <Link to="/" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">返回主页</Link>
             <button onClick={() => { setToken(''); localStorage.removeItem('adminToken'); }} className="text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/10 px-4 py-2 rounded-lg border border-rose-500/20">退出登录</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Settings Group */}
          <div className="bg-[#111] border border-white/[0.05] shadow-2xl rounded-3xl p-8 relative overflow-hidden">
            <h2 className="text-xl font-semibold text-white mb-8 flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-blue-500"></div>
               站点设置
            </h2>
            <form onSubmit={handleSaveSettings} className="space-y-5">
               <div>
                 <label className={labelClass}>姓名 *</label>
                 <input value={settings.name} onChange={e=>setSettings({...settings, name: e.target.value})} className={inputClass} required />
               </div>
               <div>
                 <label className={labelClass}>头衔/职位</label>
                 <input value={settings.title} onChange={e=>setSettings({...settings, title: e.target.value})} className={inputClass} />
               </div>
               <div>
                 <label className={labelClass}>简介</label>
                 <textarea value={settings.description} onChange={e=>setSettings({...settings, description: e.target.value})} className={`${inputClass} min-h-[100px]`} />
               </div>
               <div>
                 <label className={labelClass}>头像链接 (URL)</label>
                 <input value={settings.avatar_url} onChange={e=>setSettings({...settings, avatar_url: e.target.value})} className={inputClass} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className={labelClass}>Github 链接</label>
                   <input value={settings.github_url} onChange={e=>setSettings({...settings, github_url: e.target.value})} className={inputClass} />
                 </div>
                 <div>
                   <label className={labelClass}>Twitter 链接</label>
                   <input value={settings.twitter_url} onChange={e=>setSettings({...settings, twitter_url: e.target.value})} className={inputClass} />
                 </div>
               </div>
               
               <h3 className="text-sm font-semibold text-white pt-6 pb-2 border-t border-white/10 mt-6">UI 文案</h3>
               <div className="grid grid-cols-3 gap-4">
                 <div>
                   <label className={labelClass}>足迹大标题</label>
                   <input placeholder="足迹·FOOTPRINTS" value={settings.map_title || ''} onChange={e=>setSettings({...settings, map_title: e.target.value})} className={inputClass} />
                 </div>
                 <div>
                   <label className={labelClass}>足迹小标题</label>
                   <input placeholder="走遍大江南北" value={settings.map_subtitle || ''} onChange={e=>setSettings({...settings, map_subtitle: e.target.value})} className={inputClass} />
                 </div>
                 <div>
                   <label className={labelClass}>地图单位</label>
                   <input placeholder="点亮城市" value={settings.map_unit || ''} onChange={e=>setSettings({...settings, map_unit: e.target.value})} className={inputClass} />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className={labelClass}>卡片1 名称/值</label>
                   <div className="flex gap-2">
                     <input placeholder="坐标" value={settings.stat_1_label || ''} onChange={e=>setSettings({...settings, stat_1_label: e.target.value})} className={inputClass} />
                     <input placeholder="地球" value={settings.stat_1_value || ''} onChange={e=>setSettings({...settings, stat_1_value: e.target.value})} className={inputClass} />
                   </div>
                 </div>
                 <div>
                   <label className={labelClass}>卡片2 名称/值</label>
                   <div className="flex gap-2">
                     <input placeholder="经验" value={settings.stat_2_label || ''} onChange={e=>setSettings({...settings, stat_2_label: e.target.value})} className={inputClass} />
                     <input placeholder="持续迭代中" value={settings.stat_2_value || ''} onChange={e=>setSettings({...settings, stat_2_value: e.target.value})} className={inputClass} />
                   </div>
                 </div>
               </div>
               <div>
                  <label className={labelClass}>卡片3 (蓝色) 名称/值</label>
                  <div className="flex gap-2">
                     <input placeholder="状态" value={settings.stat_3_label || ''} onChange={e=>setSettings({...settings, stat_3_label: e.target.value})} className={inputClass} />
                     <input placeholder="开放合作" value={settings.stat_3_value || ''} onChange={e=>setSettings({...settings, stat_3_value: e.target.value})} className={inputClass} />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className={labelClass}>归档/博客标题</label>
                   <input placeholder="博客片段 · BLOG" value={settings.blog_title || ''} onChange={e=>setSettings({...settings, blog_title: e.target.value})} className={inputClass} />
                 </div>
                 <div>
                   <label className={labelClass}>页脚版权</label>
                   <input placeholder="CM DESIGN LAB" value={settings.footer_text || ''} onChange={e=>setSettings({...settings, footer_text: e.target.value})} className={inputClass} />
                 </div>
               </div>

               <h3 className="text-sm font-semibold text-white pt-6 pb-2 border-t border-white/10 mt-6">外观设置</h3>
               <div className="space-y-4">
                 <div>
                   <label className={labelClass}>全局背景图 (URL)</label>
                   <input value={settings.bg_image_url || ''} onChange={e=>setSettings({...settings, bg_image_url: e.target.value})} className={inputClass} placeholder="留空则使用纯黑背景" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className={labelClass}>背景效果</label>
                     <select value={settings.bg_blur || 'none'} onChange={e=>setSettings({...settings, bg_blur: e.target.value})} className={inputClass}>
                       <option value="none">常规 (清晰)</option>
                       <option value="glass">毛玻璃 (模糊)</option>
                     </select>
                   </div>
                   <div>
                     <label className={labelClass}>网站图标 Favicon (URL)</label>
                     <input value={settings.favicon_url || ''} onChange={e=>setSettings({...settings, favicon_url: e.target.value})} className={inputClass} />
                   </div>
                 </div>
               </div>

               <button type="submit" className={btnClass}>应用设置</button>
            </form>
          </div>

          <div className="flex flex-col gap-8">
            {/* Locations Group */}
            <div className="bg-[#111] border border-white/[0.05] shadow-2xl rounded-3xl p-8 relative overflow-hidden">
              <h2 className="text-xl font-semibold text-white mb-8 flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 足迹坐标集
              </h2>
              <form onSubmit={handleAddLocation} className="space-y-4 mb-8">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className={labelClass}>地名 *</label>
                     <input value={newLoc.name} onChange={e=>setNewLoc({...newLoc, name: e.target.value})} className={inputClass} required />
                   </div>
                   <div>
                     <label className={labelClass}>时间</label>
                     <input value={newLoc.date} onChange={e=>setNewLoc({...newLoc, date: e.target.value})} className={inputClass} placeholder="2026/05" />
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className={labelClass}>经度 *</label>
                     <input type="number" step="any" value={newLoc.longitude} onChange={e=>setNewLoc({...newLoc, longitude: e.target.value})} className={inputClass} placeholder="116.4" required />
                   </div>
                   <div>
                     <label className={labelClass}>纬度 *</label>
                     <input type="number" step="any" value={newLoc.latitude} onChange={e=>setNewLoc({...newLoc, latitude: e.target.value})} className={inputClass} placeholder="39.9" required />
                   </div>
                 </div>
                 <div>
                   <label className={labelClass}>回忆</label>
                   <input value={newLoc.description} onChange={e=>setNewLoc({...newLoc, description: e.target.value})} className={inputClass} />
                 </div>
                 <button type="submit" className={btnSecondaryClass}>增加足迹</button>
              </form>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                 {locations.map(loc => (
                   <div key={loc.id} className={listWrapperClass}>
                     <span className="font-medium text-white">{loc.name} <span className="opacity-40 text-xs ml-3 font-mono">{loc.longitude}, {loc.latitude}</span></span>
                     <button onClick={() => deleteLocation(loc.id)} className="text-rose-400 hover:text-rose-300 text-xs px-2 py-1 bg-rose-500/10 rounded-md">删除</button>
                   </div>
                 ))}
                 {locations.length === 0 && <div className="text-sm text-neutral-500 text-center py-4">暂无足迹记录</div>}
              </div>
            </div>

            {/* Attributes Group */}
            <div className="bg-[#111] border border-white/[0.05] shadow-2xl rounded-3xl p-8 relative overflow-hidden">
              <h2 className="text-xl font-semibold text-white mb-8 flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                 属性与图鉴
              </h2>
              <form onSubmit={handleAddAttr} className="space-y-4 mb-8">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className={labelClass}>属性名 *</label>
                     <input value={newAttr.title} onChange={e=>setNewAttr({...newAttr, title: e.target.value})} className={inputClass} required />
                   </div>
                   <div>
                     <label className={labelClass}>属性图标</label>
                     <select value={newAttr.icon} onChange={e=>setNewAttr({...newAttr, icon: e.target.value})} className={inputClass}>
                        <option value="Code2">代码 (Code2)</option>
                        <option value="Layers">图层 (Layers)</option>
                        <option value="Coffee">咖啡 (Coffee)</option>
                        <option value="PawPrint">猫爪 (PawPrint)</option>
                        <option value="GraduationCap">学位 (GraduationCap)</option>
                        <option value="Star">星星 (Star)</option>
                        <option value="Heart">心形 (Heart)</option>
                        <option value="Zap">闪电 (Zap)</option>
                     </select>
                   </div>
                 </div>
                 <div>
                   <label className={labelClass}>描述</label>
                   <input value={newAttr.description} onChange={e=>setNewAttr({...newAttr, description: e.target.value})} className={inputClass} />
                 </div>
                 <button type="submit" className={btnSecondaryClass}>增加图标</button>
              </form>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                 {attributes.map(attr => (
                   <div key={attr.id} className={listWrapperClass}>
                     <span className="font-medium text-white">{attr.icon} - {attr.title}</span>
                     <button onClick={() => deleteAttr(attr.id)} className="text-rose-400 hover:text-rose-300 text-xs px-2 py-1 bg-rose-500/10 rounded-md">删除</button>
                   </div>
                 ))}
                 {attributes.length === 0 && <div className="text-sm text-neutral-500 text-center py-4">暂无属性记录</div>}
              </div>
            </div>

            {/* Posts Group */}
            <div className="bg-[#111] border border-white/[0.05] shadow-2xl rounded-3xl p-8 relative overflow-hidden">
              <h2 className="text-xl font-semibold text-white mb-8 flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                 博客片段
              </h2>
              <form onSubmit={handleAddPost} className="space-y-4 mb-8">
                 <div>
                   <label className={labelClass}>标题 *</label>
                   <input value={newPost.title} onChange={e=>setNewPost({...newPost, title: e.target.value})} className={inputClass} required />
                 </div>
                 <div>
                   <label className={labelClass}>配图 URL</label>
                   <input value={newPost.image_url} onChange={e=>setNewPost({...newPost, image_url: e.target.value})} className={inputClass} placeholder="https://..." />
                 </div>
                 <div>
                   <label className={labelClass}>正文 *</label>
                   <textarea border-white className={`${inputClass} min-h-[120px]`} value={newPost.content} onChange={e=>setNewPost({...newPost, content: e.target.value})} required />
                 </div>
                 <button type="submit" className={btnSecondaryClass}>发表日志</button>
              </form>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                 {posts.map(post => (
                   <div key={post.id} className={listWrapperClass}>
                     <span className="truncate font-medium text-white">{post.title} <span className="opacity-40 text-xs ml-3 font-mono">views: {post.views}</span></span>
                     <button onClick={() => deletePost(post.id)} className="text-rose-400 hover:text-rose-300 text-xs shrink-0 ml-4 px-2 py-1 bg-rose-500/10 rounded-md">删除</button>
                   </div>
                 ))}
                 {posts.length === 0 && <div className="text-sm text-neutral-500 text-center py-4">暂无博客日志</div>}
               </div>
            </div>
            <div className="bg-[#111] border border-white/[0.05] shadow-2xl rounded-3xl p-8 relative overflow-hidden">
              <h2 className="text-xl font-semibold text-white mb-8 flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                 账号安全
              </h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                 <div>
                   <label className={labelClass}>新密码</label>
                   <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className={inputClass} placeholder="输入新密码..." required />
                 </div>
                 <button type="submit" className="w-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium py-2.5 rounded-xl hover:bg-rose-500/20 transition-all text-sm mt-4">修改密码</button>
              </form>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
