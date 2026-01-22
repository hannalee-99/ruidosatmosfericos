
import { Work, Signal, AboutData, ConnectConfig, SensorData } from './types';

// ==============================================================================
// ARQUIVO DE DADOS INICIAIS
// ==============================================================================
// Para atualizar este arquivo com os dados que você criou no Backoffice:
// 1. Acesse o site e faça login no Backoffice (ícone de cadeado ou senha).
// 2. Vá até a aba "Sincronia".
// 3. Clique no botão "COPIAR CÓDIGO" (botão verde/destaque).
// 4. Volte aqui, apague TODO o conteúdo deste arquivo e COLE o que foi copiado.
// 5. Salve e faça o commit para o GitHub.
// ==============================================================================

export const INITIAL_DATA: {
  works: Work[];
  signals: Signal[];
  about: {
    profile: AboutData | null;
    connect_config: ConnectConfig | null;
    sensor_metrics: SensorData | null;
  };
} = {
  "works": [],
  "signals": [],
  "about": {
    "profile": null,
    "connect_config": null,
    "sensor_metrics": null
  }
};
