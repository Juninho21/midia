import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, DollarSign, Bitcoin, Thermometer } from 'lucide-react';

interface WidgetBarProps {
  cidade: string;
}

export const WidgetBar = ({ cidade }: WidgetBarProps) => {
  const [dolar, setDolar] = useState<string>('...');
  const [bitcoin, setBitcoin] = useState<string>('...');
  const [weather, setWeather] = useState<{ temp: number; desc: string; isDay: boolean } | null>(null);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Cotações
        const resMoedas = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,BTC-BRL');
        const dataMoedas = await resMoedas.json();
        if (dataMoedas.USDBRL) {
          setDolar(Number(dataMoedas.USDBRL.bid).toFixed(2).replace('.', ','));
        }
        if (dataMoedas.BTCBRL) {
          // Format as BRL currency
          const btcValue = Number(dataMoedas.BTCBRL.bid);
          setBitcoin(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(btcValue));
        }

        // Clima
        const cityName = cidade || 'São Paulo';
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=pt`);
        const geoData = await geoRes.json();
        
        if (geoData.results && geoData.results.length > 0) {
          const { latitude, longitude } = geoData.results[0];
          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          const weatherData = await weatherRes.json();
          
          if (weatherData.current_weather) {
            const { temperature, weathercode, is_day } = weatherData.current_weather;
            
            // Simples mapeamento de código WMO para texto (pode ser expandido)
            let desc = 'Céu limpo';
            if (weathercode > 0 && weathercode <= 3) desc = 'Parcialmente nublado';
            if (weathercode >= 45 && weathercode <= 48) desc = 'Neblina';
            if (weathercode >= 51 && weathercode <= 67) desc = 'Chuva';
            if (weathercode >= 71 && weathercode <= 77) desc = 'Neve';
            if (weathercode >= 80 && weathercode <= 82) desc = 'Pancadas de chuva';
            if (weathercode >= 95) desc = 'Tempestade';

            setWeather({ temp: temperature, desc, isDay: is_day === 1 });
          }
        }
      } catch (error) {
        console.error('Erro ao buscar widgets:', error);
      }
    };

    carregarDados();
    // Atualiza a cada 5 minutos
    const interval = setInterval(carregarDados, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cidade]);

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(10px)',
      color: 'white',
      padding: '0.75rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 100,
      borderTop: '1px solid rgba(255,255,255,0.1)',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Ticker de Moedas */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DollarSign size={20} color="#10b981" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold' }}>Dólar</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>R$ {dolar}</span>
          </div>
        </div>
        
        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.2)' }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bitcoin size={20} color="#f59e0b" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold' }}>Bitcoin</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{bitcoin}</span>
          </div>
        </div>
      </div>

      {/* Ticker de Clima */}
      {weather && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold' }}>{cidade || 'São Paulo'}</span>
            <span style={{ fontSize: '1rem', fontWeight: 500 }}>{weather.desc}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '50px' }}>
            {weather.desc.includes('Chuva') ? <CloudRain size={24} color="#60a5fa" /> : 
             weather.desc.includes('nublado') ? <Cloud size={24} color="#9ca3af" /> : 
             weather.isDay ? <Sun size={24} color="#fbbf24" /> : <Cloud size={24} color="#9ca3af" />}
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.round(weather.temp)}°C</span>
          </div>
        </div>
      )}
    </div>
  );
};
