-- Execute este script no SQL Editor do Supabase

-- Criação da tabela de Mídias
CREATE TABLE midias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'image' | 'video' | 'pdf'
    url TEXT NOT NULL,
    size TEXT,
    thumb TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criação da tabela de Playlists
CREATE TABLE playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criação da tabela de itens da Playlist
CREATE TABLE playlist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    midia_id UUID REFERENCES midias(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    duration_ms INTEGER DEFAULT 5000, -- 5 segundos padrão para imagens
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criação da tabela de Telas (TVs)
CREATE TABLE telas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL, -- Código de 6 a 8 letras que aparece na TV
    name TEXT NOT NULL,
    playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'inactive', -- 'active' | 'inactive'
    cidade TEXT DEFAULT 'São Paulo', -- Para widget de clima
    last_ping TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE telas;
ALTER PUBLICATION supabase_realtime ADD TABLE playlists;
ALTER PUBLICATION supabase_realtime ADD TABLE playlist_items;
ALTER PUBLICATION supabase_realtime ADD TABLE midias;
