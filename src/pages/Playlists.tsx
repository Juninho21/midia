import React, { useState, useEffect } from 'react';
import { Plus, ListVideo, Clock, Play, Trash2, ArrowRight, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Playlists = () => {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States para o modo de Edição de Playlist
  const [editingPlaylist, setEditingPlaylist] = useState<any>(null);
  const [playlistItems, setPlaylistItems] = useState<any[]>([]);
  const [todasMidias, setTodasMidias] = useState<any[]>([]);

  const carregarPlaylists = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('playlists')
      .select('*, playlist_items(count)')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setPlaylists(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarPlaylists();
  }, []);

  const novaPlaylist = async () => {
    const name = prompt('Qual o nome da nova playlist? (ex: Promoções da Semana)');
    if (!name) return;
    
    const { error } = await supabase.from('playlists').insert([{ name }]);
    if (error) alert('Erro: ' + error.message);
    else carregarPlaylists();
  };

  const deletarPlaylist = async (id: string) => {
    if(!confirm('Deseja realmente deletar esta playlist?')) return;
    await supabase.from('playlists').delete().eq('id', id);
    carregarPlaylists();
  };

  // Funções de Edição
  const abrirEditor = async (playlist: any) => {
    setEditingPlaylist(playlist);
    
    // Buscar itens atuais da playlist
    const { data: items } = await supabase
      .from('playlist_items')
      .select('*, midias(*)')
      .eq('playlist_id', playlist.id)
      .order('order_index', { ascending: true });
      
    setPlaylistItems(items || []);

    // Buscar todas as mídias disponíveis
    const { data: midias } = await supabase
      .from('midias')
      .select('*')
      .order('created_at', { ascending: false });
      
    setTodasMidias(midias || []);
  };

  const fecharEditor = () => {
    setEditingPlaylist(null);
    carregarPlaylists(); // recarrega para atualizar a contagem de itens
  };

  const adicionarMidia = async (midia: any) => {
    const novoItem = {
      playlist_id: editingPlaylist.id,
      midia_id: midia.id,
      order_index: playlistItems.length,
      duration_ms: midia.type === 'video' ? 15000 : 7000 // default: 15s video, 7s img/pdf
    };

    const { data, error } = await supabase.from('playlist_items').insert([novoItem]).select('*, midias(*)').single();
    if (!error && data) {
      setPlaylistItems([...playlistItems, data]);
    }
  };

  const removerItem = async (itemId: string) => {
    await supabase.from('playlist_items').delete().eq('id', itemId);
    setPlaylistItems(playlistItems.filter(item => item.id !== itemId));
  };

  const atualizarTempo = async (itemId: string, segundos: number) => {
    const duration_ms = segundos * 1000;
    await supabase.from('playlist_items').update({ duration_ms }).eq('id', itemId);
    setPlaylistItems(playlistItems.map(item => item.id === itemId ? { ...item, duration_ms } : item));
  };

  // Renderização do Modo de Edição
  if (editingPlaylist) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Editando: {editingPlaylist.name}</h1>
            <p className="text-secondary">Arraste para reordenar (em breve) ou altere o tempo de cada mídia.</p>
          </div>
          <button className="btn btn-secondary" onClick={fecharEditor}>
            <X size={18} /> Fechar Editor
          </button>
        </div>

        <div style={{ display: 'flex', gap: '2rem' }}>
          {/* Coluna Esquerda: Itens da Playlist */}
          <div style={{ flex: 1 }}>
            <h3 className="font-bold mb-4 text-xl flex items-center gap-2"><ListVideo size={20} /> Sequência de Exibição</h3>
            {playlistItems.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '2rem', borderStyle: 'dashed' }}>
                <p className="text-secondary">A playlist está vazia. Adicione mídias na coluna ao lado.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {playlistItems.map((item, index) => (
                  <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>{index + 1}</div>
                    
                    <div style={{ width: '60px', height: '60px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                      {item.midias.type === 'image' ? (
                        <img src={item.midias.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Thumb" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', fontSize: '0.6rem', fontWeight: 'bold' }}>{item.midias.type}</div>
                      )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div className="font-bold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{item.midias.name}</div>
                      <div className="text-sm text-secondary">Tipo: {item.midias.type}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} className="text-secondary" />
                      <input 
                        type="number" 
                        value={item.duration_ms / 1000} 
                        onChange={(e) => atualizarTempo(item.id, Number(e.target.value))}
                        className="input-field" 
                        style={{ width: '80px', padding: '0.4rem', margin: 0 }} 
                        min="1"
                      />
                      <span className="text-sm text-secondary">seg</span>
                    </div>

                    <button className="btn btn-danger" style={{ padding: '0.5rem' }} onClick={() => removerItem(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coluna Direita: Biblioteca de Mídias */}
          <div style={{ flex: 1 }}>
            <h3 className="font-bold mb-4 text-xl">Biblioteca de Mídias</h3>
            <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {todasMidias.map(midia => (
                <div key={midia.id} className="card" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ height: '100px', background: 'var(--bg-primary)', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                    {midia.type === 'image' && <img src={midia.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Thumb" />}
                    {midia.type !== 'image' && <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{midia.type.toUpperCase()}</div>}
                  </div>
                  <div className="text-xs font-bold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{midia.name}</div>
                  <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem' }} onClick={() => adicionarMidia(midia)}>
                    <ArrowRight size={14} /> Adicionar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderização da Lista de Playlists
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Playlists</h1>
          <p className="text-secondary">Crie sequências de exibição com suas mídias.</p>
        </div>
        <button className="btn btn-primary" onClick={novaPlaylist}>
          <Plus size={18} />
          Nova Playlist
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando playlists...</div>
      ) : playlists.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <ListVideo size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 className="text-xl font-bold mb-2">Nenhuma playlist</h3>
          <p className="text-secondary mb-4">Crie sua primeira playlist para gerenciar as mídias das suas TVs.</p>
          <button className="btn btn-primary" onClick={novaPlaylist}>Criar Playlist</button>
        </div>
      ) : (
        <div className="grid-cards">
          {playlists.map(playlist => (
            <div key={playlist.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', color: 'var(--success)' }}>
                    <ListVideo size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{playlist.name}</h3>
                    <p className="text-sm text-secondary">
                      Criado em {new Date(playlist.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button className="btn btn-danger" style={{ padding: '0.5rem', background: 'transparent', border: 'none' }} onClick={() => deletarPlaylist(playlist.id)}>
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex gap-4 mb-6">
                <div style={{ flex: 1, background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div className="text-sm text-secondary mb-1">Total de Mídias</div>
                  <div className="font-bold">{playlist.playlist_items?.[0]?.count || 0} itens</div>
                </div>
              </div>

              <div className="flex gap-2" style={{ marginTop: 'auto' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => abrirEditor(playlist)}>
                  Configurar Mídias
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Playlists;
