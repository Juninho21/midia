import { useState, useEffect } from 'react';
import { Plus, MonitorPlay, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Telas = () => {
  const [telas, setTelas] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarDados = async () => {
    setLoading(true);
    
    // Busca telas
    const { data: dataTelas } = await supabase
      .from('telas')
      .select('*, playlists (name)')
      .order('created_at', { ascending: false });
      
    // Busca playlists para o select
    const { data: dataPlaylists } = await supabase
      .from('playlists')
      .select('id, name')
      .order('name', { ascending: true });
      
    if (dataTelas) setTelas(dataTelas);
    if (dataPlaylists) setPlaylists(dataPlaylists);
    
    setLoading(false);
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const gerarCodigo = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for(let i=0; i<8; i++) {
      if(i===4) code += '-';
      else code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const novaTela = async () => {
    const name = prompt('Qual o nome desta TV? (ex: Recepção Principal)');
    if (!name) return;
    
    const codigo = gerarCodigo();
    const { error } = await supabase.from('telas').insert([
      { name, codigo, status: 'inactive' }
    ]);
    
    if (error) alert('Erro ao criar tela: ' + error.message);
    else carregarDados();
  };

  const deletarTela = async (id: string) => {
    if(!confirm('Deseja deletar o registro desta TV?')) return;
    await supabase.from('telas').delete().eq('id', id);
    carregarDados();
  };

  const mudarPlaylist = async (telaId: string, novaPlaylistId: string) => {
    const id = novaPlaylistId === "" ? null : novaPlaylistId;
    await supabase.from('telas').update({ playlist_id: id }).eq('id', telaId);
    carregarDados();
  };

  const mudarCidade = async (telaId: string, novaCidade: string) => {
    await supabase.from('telas').update({ cidade: novaCidade }).eq('id', telaId);
    carregarDados();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciar Telas</h1>
          <p className="text-secondary">Cadastre as TVs e escolha qual Playlist cada uma vai tocar.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={carregarDados}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="btn btn-primary" onClick={novaTela}>
            <Plus size={18} />
            Nova Tela
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando telas...</div>
      ) : telas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <MonitorPlay size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 className="text-xl font-bold mb-2">Nenhuma tela cadastrada</h3>
          <p className="text-secondary mb-4">Adicione sua primeira TV para começar a exibir conteúdos.</p>
          <button className="btn btn-primary" onClick={novaTela}>Adicionar TV</button>
        </div>
      ) : (
        <div className="grid-cards">
          {telas.map(tela => {
            const lastPing = tela.last_ping ? new Date(tela.last_ping).getTime() : 0;
            const isOnline = tela.status === 'active' && (Date.now() - lastPing < 120000); // 2 minutos tolerancia
            
            return (
              <div key={tela.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="flex justify-between items-start mb-4">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: 'var(--radius-md)', 
                      backgroundColor: 'var(--bg-elevated)', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--border-color)'
                    }}>
                      <MonitorPlay size={20} color={isOnline ? 'var(--success)' : 'var(--text-muted)'} />
                    </div>
                    <div>
                      <h3 className="font-bold">{tela.name}</h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', letterSpacing: '1px' }}>
                        COD: {tela.codigo}
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${isOnline ? 'badge-active' : 'badge-inactive'}`}>
                    <span className="badge-dot"></span>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                
                <div className="mb-6 flex-1">
                  <div className="input-label mb-2">Vincular Playlist</div>
                  <select 
                    className="input-field" 
                    value={tela.playlist_id || ""}
                    onChange={(e) => mudarPlaylist(tela.id, e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">Nenhuma playlist selecionada</option>
                    {playlists.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-6 flex-1">
                  <div className="input-label mb-2">Cidade (Previsão do Tempo)</div>
                  <input 
                    type="text"
                    className="input-field" 
                    defaultValue={tela.cidade || "São Paulo"}
                    onBlur={(e) => mudarCidade(tela.id, e.target.value)}
                    placeholder="Ex: Rio de Janeiro"
                  />
                </div>
                
                <div className="flex gap-2" style={{ marginTop: 'auto' }}>
                  <button className="btn btn-danger" style={{ padding: '0.625rem' }} onClick={() => deletarTela(tela.id)} title="Excluir Tela">
                    <Trash2 size={16} />
                  </button>
                  <Link to={`/player/${tela.codigo}`} target="_blank" className="btn btn-primary" style={{ flex: 1, padding: '0.625rem' }} title="Abrir Player de TV">
                    <ExternalLink size={16} /> Abrir Tela
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Telas;
