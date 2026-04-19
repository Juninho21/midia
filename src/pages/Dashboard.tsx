import React, { useState, useEffect } from 'react';
import { MonitorPlay, Image as ImageIcon, ListVideo, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    telasTotal: 0,
    telasAtivas: 0,
    midiasTotal: 0,
    playlistsTotal: 0
  });
  const [telasRecentes, setTelasRecentes] = useState<any[]>([]);

  const carregarDados = async () => {
    setLoading(true);
    
    // Contagem de Mídias
    const { count: midiasCount } = await supabase
      .from('midias')
      .select('*', { count: 'exact', head: true });

    // Contagem de Playlists
    const { count: playlistsCount } = await supabase
      .from('playlists')
      .select('*', { count: 'exact', head: true });

    // Busca Telas e conta ativas
    const { data: telasData } = await supabase
      .from('telas')
      .select('*, playlists(name)')
      .order('last_ping', { ascending: false });

    let ativas = 0;
    const now = Date.now();
    
    if (telasData) {
      telasData.forEach(tela => {
        const lastPing = tela.last_ping ? new Date(tela.last_ping).getTime() : 0;
        // Tela é considerada ativa se enviou ping nos últimos 2 minutos (120000ms)
        if (tela.status === 'active' && (now - lastPing < 120000)) {
          ativas++;
        }
      });
    }

    setStats({
      telasTotal: telasData?.length || 0,
      telasAtivas: ativas,
      midiasTotal: midiasCount || 0,
      playlistsTotal: playlistsCount || 0
    });

    setTelasRecentes(telasData || []);
    setLoading(false);
  };

  useEffect(() => {
    carregarDados();
    
    // Atualiza a cada 30 segundos automaticamente
    const interval = setInterval(carregarDados, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Visão Geral</h1>
          <p className="text-secondary">Monitore o status da sua rede de telas de mídia indoor.</p>
        </div>
        <button className="btn btn-secondary" onClick={carregarDados}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      <div className="grid-cards mb-8">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-secondary font-bold">Telas Ativas</h3>
            <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: 'var(--accent-primary)' }}>
              <MonitorPlay size={24} />
            </div>
          </div>
          <div className="text-4xl font-bold mb-2">
            {stats.telasAtivas} <span className="text-2xl text-muted">/ {stats.telasTotal}</span>
          </div>
          <p className="text-secondary text-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: stats.telasAtivas === stats.telasTotal && stats.telasTotal > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
              {stats.telasAtivas === stats.telasTotal && stats.telasTotal > 0 ? '100% online' : 'Telas conectadas'}
            </span>
          </p>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-secondary font-bold">Mídias</h3>
            <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', color: 'var(--accent-secondary)' }}>
              <ImageIcon size={24} />
            </div>
          </div>
          <div className="text-4xl font-bold mb-2">{stats.midiasTotal}</div>
          <p className="text-secondary text-sm">Arquivos armazenados</p>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-secondary font-bold">Playlists</h3>
            <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: 'var(--success)' }}>
              <ListVideo size={24} />
            </div>
          </div>
          <div className="text-4xl font-bold mb-2">{stats.playlistsTotal}</div>
          <p className="text-secondary text-sm">Sequências configuradas</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Status Recente das Telas</h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {telasRecentes.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhuma tela cadastrada no sistema.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nome da TV</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Código</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Playlist Atual</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {telasRecentes.map((tela, idx) => {
                const lastPing = tela.last_ping ? new Date(tela.last_ping).getTime() : 0;
                const isOnline = tela.status === 'active' && (Date.now() - lastPing < 120000);
                
                return (
                  <tr key={tela.id} style={{ borderBottom: idx !== telasRecentes.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{tela.name}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{tela.codigo}</td>
                    <td style={{ padding: '1rem' }}>{tela.playlists?.name || <span className="text-muted">Nenhuma</span>}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${isOnline ? 'badge-active' : 'badge-inactive'}`}>
                        <span className="badge-dot"></span>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
