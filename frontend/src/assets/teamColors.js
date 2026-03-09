export const TEAM_COLORS = {
  red_bull: '#3671C6',
  ferrari: '#E8001C',
  mercedes: '#27F4D2',
  mclaren: '#FF8000',
  aston_martin: '#229971',
  alpine: '#FF87BC',
  williams: '#64C4FF',
  rb: '#6692FF',
  kick_sauber: '#52E252',
  haas: '#B6BABD',
}

export const FLAG_EMOJI = {
  Australia: '🇦🇺', Bahrain: '🇧🇭', China: '🇨🇳', Japan: '🇯🇵', Saudi: '🇸🇦',
  'Saudi Arabia': '🇸🇦', Miami: '🇺🇸', USA: '🇺🇸', Monaco: '🇲🇨', Canada: '🇨🇦',
  Spain: '🇪🇸', Austria: '🇦🇹', UK: '🇬🇧', 'United Kingdom': '🇬🇧', Hungary: '🇭🇺',
  Belgium: '🇧🇪', Netherlands: '🇳🇱', Italy: '🇮🇹', Azerbaijan: '🇦🇿', Singapore: '🇸🇬',
  Mexico: '🇲🇽', Brazil: '🇧🇷', 'Las Vegas': '🇺🇸', Qatar: '🇶🇦', UAE: '🇦🇪',
  'Abu Dhabi': '🇦🇪',
}

export function getFlag(country) {
  return FLAG_EMOJI[country] || '🏁'
}

export function getTeamColor(teamRef) {
  return TEAM_COLORS[teamRef] || '#E8001C'
}
