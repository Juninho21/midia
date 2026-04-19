import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { WidgetBar } from '../components/WidgetBar';

interface MediaItem {
  type: string;
  url: string;
  duration: number;
}

const Player = () => {
  const { code } = useParams();
  const [isLinked, setIsLinked] = useState(false);
  const [playlist, setPlaylist] = useState<MediaItem[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [telaInfo, setTelaInfo] = useState<any>(null);

  // Carregar dados iniciais da Tela
  const loadTela = async () => {
    if (!code) return;
    
    // Buscar a tela pelo codigo
    const { data: tela, error } = await supabase
      .from('telas')
      .select('*')
      .eq('codigo', code)
      .single();

    if (error || !tela) {
      setIsLinked(false);
      return;
    }

    setTelaInfo(tela);
    setIsLinked(true);

    if (tela.playlist_id) {
      loadPlaylist(tela.playlist_id);
    }
    
    // Atualiza status para online
    await supabase.from('telas').update({ status: 'active', last_ping: new Date().toISOString() }).eq('id', tela.id);
  };

  const loadPlaylist = async (playlistId: string) => {
    // Buscar os items da playlist com os dados da mídia, ordenados
    const { data: items, error } = await supabase
      .from('playlist_items')
      .select(`
        duration_ms,
        order_index,
        midias (
          type,
          url
        )
      `)
      .eq('playlist_id', playlistId)
      .order('order_index', { ascending: true });

    if (error || !items || items.length === 0) {
      setPlaylist([]);
      return;
    }

    const formattedPlaylist = items.map((item: any) => ({
      type: item.midias.type,
      url: item.midias.url,
      duration: item.duration_ms || 5000
    }));

    setPlaylist(formattedPlaylist);
    setCurrentMediaIndex(0);
  };

  // Ping periódico e carga inicial
  useEffect(() => {
    loadTela();
    
    // Ping a cada 1 minuto para manter status online
    const interval = setInterval(() => {
      if (telaInfo?.id) {
        supabase.from('telas').update({ last_ping: new Date().toISOString(), status: 'active' }).eq('id', telaInfo.id);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [code]);

  // Realtime subscription para atualizar instantaneamente se a playlist mudar no dashboard
  useEffect(() => {
    if (!telaInfo) return;

    const subscription = supabase
      .channel('tela-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'telas', filter: `id=eq.${telaInfo.id}` }, (payload) => {
        const novaTela = payload.new;
        if (novaTela.playlist_id !== telaInfo.playlist_id) {
          loadPlaylist(novaTela.playlist_id);
        }
        setTelaInfo(novaTela);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      // Ao sair, marca como offline
      supabase.from('telas').update({ status: 'inactive' }).eq('id', telaInfo.id);
    };
  }, [telaInfo?.id]);

  // Timer para o slider de mídia
  useEffect(() => {
    if (!isLinked || playlist.length === 0) return;
    
    const media = playlist[currentMediaIndex];
    
    if (media.type !== 'video') {
      const timer = setTimeout(() => {
        setCurrentMediaIndex((prev) => (prev + 1) % playlist.length);
      }, media.duration);
      return () => clearTimeout(timer);
    }
  }, [currentMediaIndex, isLinked, playlist]);

  // Renderizações
  if (!isLinked) {
    return (
      <div className="player-container player-code-screen">
        <h2 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: '1rem' }}>Vincule esta TV</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Acesse seu dashboard e cadastre a tela usando este código:</p>
        <div className="player-code animate-pulse">{code || 'XXXX-XXXX'}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <div className="badge-dot" style={{ backgroundColor: 'var(--accent-primary)', animation: 'pulse 1.5s infinite' }}></div>
          Aguardando configuração no painel...
        </div>
      </div>
    );
  }

  if (playlist.length === 0) {
    return (
      <div className="player-container player-code-screen" style={{ background: '#000' }}>
        <h1 style={{ color: 'var(--text-muted)' }}>Nenhuma mídia vinculada.</h1>
      </div>
    );
  }

  const media = playlist[currentMediaIndex];

  return (
    <div className="player-container">
      {media.type === 'image' || media.type === 'pdf' ? (
        <>
          {/* Fundo Desfocado (Preenche a tela inteira) */}
          <div 
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: `url(${media.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(25px) brightness(0.6)',
              transform: 'scale(1.1)', // Remove bordas brancas do blur
              zIndex: 0
            }}
            className="animate-fade-in"
            key={"bg-" + media.url + currentMediaIndex}
          />
          {/* Imagem Principal (Sem cortes, por cima do fundo) */}
          <img 
            src={media.url} 
            alt="Media" 
            className="player-media animate-fade-in"
            style={{ position: 'relative', zIndex: 1, objectFit: 'contain' }}
            key={media.url + currentMediaIndex}
          />
        </>
      ) : media.type === 'video' ? (
        <video 
          src={media.url} 
          autoPlay 
          muted 
          className="player-media animate-fade-in"
          key={media.url + currentMediaIndex}
          onEnded={() => setCurrentMediaIndex((prev) => (prev + 1) % playlist.length)}
          onError={() => setCurrentMediaIndex((prev) => (prev + 1) % playlist.length)} // Pula se erro
        />
      ) : null}
      
      {/* Barra de Widgets (Dólar, Bitcoin, Clima) */}
      <WidgetBar cidade={telaInfo?.cidade || 'São Paulo'} />
    </div>
  );
};

export default Player;
