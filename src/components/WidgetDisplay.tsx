import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, DollarSign, Bitcoin } from 'lucide-react';

interface WidgetDisplayProps {
  cidade: string;
  widgetUrl: string; // 'widget:dolar' | 'widget:bitcoin' | 'widget:weather'
}

export const WidgetDisplay = ({ cidade, widgetUrl }: WidgetDisplayProps) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        if (widgetUrl === 'widget:dolar' || widgetUrl === 'widget:bitcoin') {
          const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,BTC-BRL');
          const json = await res.json();
          if (widgetUrl === 'widget:dolar' && json.USDBRL) {
            setData({
              titulo: 'Cotação do Dólar',
              valor: `R$ ${Number(json.USDBRL.bid).toFixed(2).replace('.', ',')}`,
              icone: 'dolar'
            });
          }
          if (widgetUrl === 'widget:bitcoin' && json.BTCBRL) {
            const btcValue = Number(json.BTCBRL.bid);
            setData({
              titulo: 'Cotação do Bitcoin',
              valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(btcValue),
              icone: 'bitcoin'
            });
          }
        }

        if (widgetUrl === 'widget:weather') {
          const cityName = cidade || 'São Paulo';
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=pt`);
          const geoData = await geoRes.json();
          
          if (geoData.results && geoData.results.length > 0) {
            const { latitude, longitude } = geoData.results[0];
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            const weatherData = await weatherRes.json();
            
            if (weatherData.current_weather) {
              const { temperature, weathercode, is_day } = weatherData.current_weather;
              
              let desc = 'Céu limpo';
              if (weathercode > 0 && weathercode <= 3) desc = 'Parcialmente nublado';
              if (weathercode >= 45 && weathercode <= 48) desc = 'Neblina';
              if (weathercode >= 51 && weathercode <= 67) desc = 'Chuva';
              if (weathercode >= 71 && weathercode <= 77) desc = 'Neve';
              if (weathercode >= 80 && weathercode <= 82) desc = 'Pancadas de chuva';
              if (weathercode >= 95) desc = 'Tempestade';

              setData({
                titulo: `Clima em ${cityName}`,
                valor: `${Math.round(temperature)}°C`,
                desc,
                isDay: is_day === 1,
                icone: 'weather'
              });
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar widget data:', error);
      }
    };

    carregarDados();
    const interval = setInterval(carregarDados, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cidade, widgetUrl]);

  if (!data) return (
    <div className="player-media animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div className="animate-pulse text-secondary text-2xl">Carregando Informações...</div>
    </div>
  );

  return (
    <div className="player-media animate-fade-in" style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-primary) 100%)',
      color: 'white', fontFamily: 'Inter, sans-serif'
    }}>
      {data.icone === 'dolar' && <DollarSign size={120} color="#10b981" style={{ marginBottom: '2rem' }} />}
      {data.icone === 'bitcoin' && <Bitcoin size={120} color="#f59e0b" style={{ marginBottom: '2rem' }} />}
      {data.icone === 'weather' && (
        <div style={{ marginBottom: '2rem' }}>
          {data.desc.includes('Chuva') ? <CloudRain size={120} color="#60a5fa" /> : 
           data.desc.includes('nublado') ? <Cloud size={120} color="#9ca3af" /> : 
           data.isDay ? <Sun size={120} color="#fbbf24" /> : <Cloud size={120} color="#9ca3af" />}
        </div>
      )}

      <h2 style={{ fontSize: '3rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 500, textAlign: 'center' }}>
        {data.titulo}
      </h2>
      
      <div style={{ fontSize: '6rem', fontWeight: 800, background: 'linear-gradient(to right, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center' }}>
        {data.valor}
      </div>

      {data.icone === 'weather' && (
        <div style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
          {data.desc}
        </div>
      )}
    </div>
  );
};
