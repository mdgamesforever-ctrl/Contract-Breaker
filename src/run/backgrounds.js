// Background art wired to the points in a run where the screen changes.
// Run.enterNode() picks one of these per node type/kind so a future (or
// the current web) renderer has somewhere to read them from.
export const BACKGROUNDS = Object.freeze({
  mapScreen: 'assets/backgrounds/bg_02_shard_network_nodemap.png',
  nodeTransition: 'assets/backgrounds/bg_01_the_fractured_descent_mapscreen.png',
  bossArena: 'assets/backgrounds/bg_03_the_bled_throne_bossfight.png',
  // Placeholder art (see ASSET_TODO.md): a distinct background for rest
  // nodes rather than reusing the regular-fight nodeTransition art, and a
  // distinct arena for the mid-run mini-boss rather than reusing the final
  // boss's arena.
  restSanctum: 'assets/backgrounds/placeholder_bg_04_the_hollow_sanctum.svg',
  miniBossArena: 'assets/backgrounds/placeholder_bg_05_the_acolytes_hollow.svg',
});
