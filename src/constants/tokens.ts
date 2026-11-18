import '@/global.css';

/** Design tokens for the launch map. Every colour and face in the app goes through here. */
export const color = {
  ground: '#170C1C',
  groundRaised: '#22132A',
  ink: '#FFF1E6',
  inkMuted: '#CFB3BF',
  line: '#3A2442',
  live: '#FF6A4D',
  rolling: '#FFB347',
  midnight: '#6FD6C4',
  ocean: '#0F2F3A',
  oceanDeep: '#08161D',
  land: '#4A3550',
  night: '#05030A',
} as const;

export const font = {
  display: 'Archivo_900Black',
  body: 'Sora_400Regular',
  bodyStrong: 'Sora_600SemiBold',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40, xxl: 72 } as const;

export const radius = { sm: 6, md: 14 } as const;

/** Content is capped and centred; gutters grow on large screens. */
export const maxWidth = 1200;
