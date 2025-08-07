// Auto-Team Optimizer v0.1 – Free Edition
console.log('[Auto-Team Optimizer] Inicializando...');

// Configuração padrão
const defaultConfig = {
  enabled: true
};
const config = Object.assign({}, defaultConfig, context.config);

// Limite de usos gratuitos por dia
const USAGE_LIMIT = 50;
const STORAGE_KEY = 'autoTeamOptimizerUsages';

// Adiciona o botão na UI do jogo
api.ui.addButton({
  id: 'auto-team-optimizer',
  text: 'Otimizar Time',
  tooltip: 'Sugere o melhor time para a sala atual',
  primary: true,
  onClick: handleOptimization
});

// Função principal de otimização
function handleOptimization() {
  const usages = getUsages();
  if (usages >= USAGE_LIMIT) {
    return api.ui.components.createModal({
      title: 'Limite Atingido',
      content: `
        <p>Você já usou o Otimizador ${USAGE_LIMIT} vezes hoje.</p>
        <p>Tente novamente amanhã ou atualize para a versão PRO.</p>
      `,
      buttons: [{ text: 'OK', primary: true }]
    });
  }

  try {
    // Dados do jogador
    const playerMonsters = globalThis.state.player.getSnapshot().context.monsters;
    // Sala/mapa atual
    const roomId   = globalThis.state.board.getSnapshot().context.roomId;
    // Monstros inimigos na sala (define slots disponíveis)
    const enemies  = globalThis.state.utils.getBoardMonstersFromRoomId(roomId);
    const capacity = enemies.length; // ex: 2 para "2/2", 3 para "3/3" etc.

    // Calcula score de cada monstro do jogador
    const scoredMonsters = playerMonsters.map(mon => {
      const geneValues = Object.values(mon.genes);
      const geneAvg    = geneValues.reduce((a, b) => a + b, 0) / geneValues.length;
      const score      = mon.tier * mon.level * geneAvg;
      return { ...mon, score };
    });

    // Seleciona os top 'capacity' monstros
    const topTeam = scoredMonsters
      .sort((a, b) => b.score - a.score)
      .slice(0, capacity);

    // Mapear nomes para exibição
    const enemyNames    = enemies   .map(e => globalThis.state.utils.getMonster(e.gameId)?.name || '—');
    const selectedNames = topTeam   .map(m => globalThis.state.utils.getMonster(m.gameId)?.name || '—');

    // Exibe modal com a sugestão
    api.ui.components.createModal({
      title: 'Sugestão de Time',
      width: 500,
      content: `
        <p><strong>Inimigos (${capacity} slots):</strong> ${enemyNames.join(', ')}</p>
        <p><strong>Time Sugerido (${capacity}):</strong> ${selectedNames.join(', ')}</p>
        <p>Critério: Tier × Nível × Média de Genes.</p>
        <p><em>Usos restantes hoje: ${USAGE_LIMIT - usages - 1}</em></p>
      `,
      buttons: [{ text: 'OK', primary: true }]
    });

    // Atualiza contador de usos
    setUsages(usages + 1);

  } catch (err) {
    console.error('[Auto-Team Optimizer] Erro ao otimizar:', err);
    api.ui.components.createModal({
      title: 'Erro',
      content: `<p>Não foi possível otimizar o time. Tente novamente mais tarde.</p>`,
      buttons: [{ text: 'OK', primary: true }]
    });
  }
}

// Recupera o número de usos já consumidos hoje
function getUsages() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const data = raw ? JSON.parse(raw) : { date: null, count: 0 };
  const today = new Date().toDateString();

  if (data.date !== today) {
    // Reinicia contador ao mudar de dia
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
    return 0;
  }

  return data.count;
}

// Salva o número de usos após cada otimização
function setUsages(count) {
  const today = new Date().toDateString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count }));
}

// Exporta funções (opcional)
exports = {
  handleOptimization,
  getUsages,
  setUsages,
  updateConfig: newConfig => Object.assign(config, newConfig)
};

console.log('[Auto-Team Optimizer] Carregado com sucesso!');
