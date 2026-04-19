import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, FileVideo, FileText, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Midias = () => {
  const [midias, setMidias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const carregarMidias = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('midias')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setMidias(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarMidias();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    // Gerar um nome de arquivo único
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      // 1. Upload para o Storage
      const { error: uploadError } = await supabase.storage
        .from('midias')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Obter a URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('midias')
        .getPublicUrl(filePath);

      // 3. Determinar o tipo
      let type = 'image';
      if (file.type.startsWith('video/')) type = 'video';
      else if (file.type === 'application/pdf') type = 'pdf';

      // 4. Salvar na tabela midias
      const { error: dbError } = await supabase.from('midias').insert([
        { 
          name: file.name, 
          type, 
          url: publicUrl,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        }
      ]);

      if (dbError) throw dbError;

      // Atualiza a lista
      carregarMidias();
    } catch (error: any) {
      alert('Erro ao fazer upload: ' + error.message);
    } finally {
      setUploading(false);
      // Limpar o input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deletarMidia = async (midia: any) => {
    if (!confirm(`Tem certeza que deseja deletar "${midia.name}"?`)) return;

    try {
      // 1. Extrair o nome do arquivo da URL (útil para deletar do storage)
      const urlParts = midia.url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // 2. Deletar do Storage
      await supabase.storage.from('midias').remove([fileName]);

      // 3. Deletar da tabela
      await supabase.from('midias').delete().eq('id', midia.id);

      carregarMidias();
    } catch (error: any) {
      alert('Erro ao deletar: ' + error.message);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'video': return <FileVideo size={32} color="var(--accent-primary)" />;
      case 'image': return <ImageIcon size={32} color="var(--accent-secondary)" />;
      case 'pdf': return <FileText size={32} color="var(--danger)" />;
      default: return <ImageIcon size={32} />;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Biblioteca de Mídias</h1>
          <p className="text-secondary">Faça upload de fotos, vídeos (MP4) e PDFs.</p>
        </div>
        <button className="btn btn-secondary" onClick={carregarMidias}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div 
        className="card mb-8" 
        style={{ borderStyle: 'dashed', borderWidth: '2px', textAlign: 'center', padding: '3rem', position: 'relative' }}
      >
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          {uploading ? (
            <RefreshCw size={32} color="var(--accent-primary)" className="animate-spin" />
          ) : (
            <UploadCloud size={32} color="var(--accent-primary)" />
          )}
        </div>
        <h3 className="text-xl font-bold mb-2">
          {uploading ? 'Enviando arquivo...' : 'Arraste arquivos aqui ou clique para buscar'}
        </h3>
        <p className="text-secondary mb-4">Suporta Imagens (JPG, PNG, GIF), Vídeos (MP4) e PDF.</p>
        
        {/* Input escondido para o upload */}
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,video/mp4,application/pdf"
          style={{ 
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            opacity: 0, cursor: 'pointer', zIndex: 10
          }}
          disabled={uploading}
        />
        
        <button className="btn btn-secondary" disabled={uploading}>
          {uploading ? 'Processando...' : 'Selecionar Arquivos'}
        </button>
      </div>

      {loading && midias.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando mídias...</div>
      ) : midias.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Nenhuma mídia encontrada na biblioteca.
        </div>
      ) : (
        <div className="grid-cards">
          {midias.map(midia => (
            <div key={midia.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '180px', background: 'var(--bg-elevated)', position: 'relative' }}>
                {midia.type === 'image' ? (
                  <img src={midia.url} alt={midia.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : midia.type === 'video' ? (
                  <video src={midia.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getIcon(midia.type)}
                  </div>
                )}
                
                <div style={{ 
                  position: 'absolute', top: '0.5rem', right: '0.5rem', 
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                  padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase'
                }}>
                  {midia.type}
                </div>
              </div>
              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 className="font-bold mb-1" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={midia.name}>
                  {midia.name}
                </h3>
                <div className="flex justify-between items-center text-sm text-secondary mb-4">
                  <span>{midia.size}</span>
                  <span>{new Date(midia.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2" style={{ marginTop: 'auto' }}>
                  <a href={midia.url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', textAlign: 'center' }}>
                    Abrir
                  </a>
                  <button className="btn btn-danger" style={{ padding: '0.5rem' }} onClick={() => deletarMidia(midia)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Midias;
