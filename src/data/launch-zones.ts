/**
 * Launch regions for GTA VI (PS5 and Xbox Series X|S), Thursday 19 November 2026.
 * Rule reported from Rockstar support: the game unlocks at midnight local time in each region.
 *
 * `offsetMinutes` is the UTC offset in force on 19 Nov 2026 (southern-hemisphere summer time
 * applied: NZDT, AEDT, ACDT; northern hemisphere on standard time). Hard-coded so every device,
 * including Hermes without full Intl time-zone data, computes the same instant.
 * `iso` is the ISO 3166-1 numeric code used by world-atlas, as a 3-digit string.
 */
export type LaunchZone = {
  id: string;
  country: string;
  place: string;
  iso: string;
  offsetMinutes: number;
  lat: number;
  lon: number;
};

export const LAUNCH_DATE = { year: 2026, month: 11, day: 19 } as const;

export const LAUNCH_ZONES: LaunchZone[] = [
  { id: 'nz', country: 'New Zealand', place: 'Auckland', iso: '554', offsetMinutes: 780, lat: -36.85, lon: 174.76 },
  { id: 'au-syd', country: 'Australia', place: 'Sydney and Melbourne', iso: '036', offsetMinutes: 660, lat: -33.87, lon: 151.21 },
  { id: 'au-adl', country: 'Australia', place: 'Adelaide', iso: '036', offsetMinutes: 630, lat: -34.93, lon: 138.6 },
  { id: 'au-bne', country: 'Australia', place: 'Brisbane', iso: '036', offsetMinutes: 600, lat: -27.47, lon: 153.03 },
  { id: 'jp', country: 'Japan', place: 'Tokyo', iso: '392', offsetMinutes: 540, lat: 35.68, lon: 139.69 },
  { id: 'kr', country: 'South Korea', place: 'Seoul', iso: '410', offsetMinutes: 540, lat: 37.57, lon: 126.98 },
  { id: 'au-per', country: 'Australia', place: 'Perth', iso: '036', offsetMinutes: 480, lat: -31.95, lon: 115.86 },
  { id: 'sg', country: 'Singapore', place: 'Singapore', iso: '702', offsetMinutes: 480, lat: 1.35, lon: 103.82 },
  { id: 'tw', country: 'Taiwan', place: 'Taipei', iso: '158', offsetMinutes: 480, lat: 25.03, lon: 121.57 },
  { id: 'hk', country: 'Hong Kong', place: 'Hong Kong', iso: '344', offsetMinutes: 480, lat: 22.32, lon: 114.17 },
  { id: 'ph', country: 'Philippines', place: 'Manila', iso: '608', offsetMinutes: 480, lat: 14.6, lon: 120.98 },
  { id: 'my', country: 'Malaysia', place: 'Kuala Lumpur', iso: '458', offsetMinutes: 480, lat: 3.14, lon: 101.69 },
  { id: 'th', country: 'Thailand', place: 'Bangkok', iso: '764', offsetMinutes: 420, lat: 13.76, lon: 100.5 },
  { id: 'id', country: 'Indonesia', place: 'Jakarta', iso: '360', offsetMinutes: 420, lat: -6.21, lon: 106.85 },
  { id: 'vn', country: 'Vietnam', place: 'Ho Chi Minh City', iso: '704', offsetMinutes: 420, lat: 10.82, lon: 106.63 },
  { id: 'in', country: 'India', place: 'Mumbai', iso: '356', offsetMinutes: 330, lat: 19.08, lon: 72.88 },
  { id: 'pk', country: 'Pakistan', place: 'Karachi', iso: '586', offsetMinutes: 300, lat: 24.86, lon: 67.01 },
  { id: 'ae', country: 'United Arab Emirates', place: 'Dubai', iso: '784', offsetMinutes: 240, lat: 25.2, lon: 55.27 },
  { id: 'sa', country: 'Saudi Arabia', place: 'Riyadh', iso: '682', offsetMinutes: 180, lat: 24.71, lon: 46.68 },
  { id: 'tr', country: 'Türkiye', place: 'Istanbul', iso: '792', offsetMinutes: 180, lat: 41.01, lon: 28.98 },
  { id: 'za', country: 'South Africa', place: 'Johannesburg', iso: '710', offsetMinutes: 120, lat: -26.2, lon: 28.05 },
  { id: 'eg', country: 'Egypt', place: 'Cairo', iso: '818', offsetMinutes: 120, lat: 30.04, lon: 31.24 },
  { id: 'gr', country: 'Greece', place: 'Athens', iso: '300', offsetMinutes: 120, lat: 37.98, lon: 23.73 },
  { id: 'fi', country: 'Finland', place: 'Helsinki', iso: '246', offsetMinutes: 120, lat: 60.17, lon: 24.94 },
  { id: 'il', country: 'Israel', place: 'Tel Aviv', iso: '376', offsetMinutes: 120, lat: 32.09, lon: 34.78 },
  { id: 'de', country: 'Germany', place: 'Berlin', iso: '276', offsetMinutes: 60, lat: 52.52, lon: 13.4 },
  { id: 'fr', country: 'France', place: 'Paris', iso: '250', offsetMinutes: 60, lat: 48.86, lon: 2.35 },
  { id: 'es', country: 'Spain', place: 'Madrid', iso: '724', offsetMinutes: 60, lat: 40.42, lon: -3.7 },
  { id: 'it', country: 'Italy', place: 'Rome', iso: '380', offsetMinutes: 60, lat: 41.9, lon: 12.5 },
  { id: 'nl', country: 'Netherlands', place: 'Amsterdam', iso: '528', offsetMinutes: 60, lat: 52.37, lon: 4.9 },
  { id: 'pl', country: 'Poland', place: 'Warsaw', iso: '616', offsetMinutes: 60, lat: 52.23, lon: 21.01 },
  { id: 'se', country: 'Sweden', place: 'Stockholm', iso: '752', offsetMinutes: 60, lat: 59.33, lon: 18.07 },
  { id: 'no', country: 'Norway', place: 'Oslo', iso: '578', offsetMinutes: 60, lat: 59.91, lon: 10.75 },
  { id: 'ng', country: 'Nigeria', place: 'Lagos', iso: '566', offsetMinutes: 60, lat: 6.52, lon: 3.38 },
  { id: 'gb', country: 'United Kingdom', place: 'London', iso: '826', offsetMinutes: 0, lat: 51.51, lon: -0.13 },
  { id: 'ie', country: 'Ireland', place: 'Dublin', iso: '372', offsetMinutes: 0, lat: 53.35, lon: -6.26 },
  { id: 'pt', country: 'Portugal', place: 'Lisbon', iso: '620', offsetMinutes: 0, lat: 38.72, lon: -9.14 },
  { id: 'br', country: 'Brazil', place: 'São Paulo', iso: '076', offsetMinutes: -180, lat: -23.55, lon: -46.63 },
  { id: 'ar', country: 'Argentina', place: 'Buenos Aires', iso: '032', offsetMinutes: -180, lat: -34.6, lon: -58.38 },
  { id: 'cl', country: 'Chile', place: 'Santiago', iso: '152', offsetMinutes: -180, lat: -33.45, lon: -70.67 },
  { id: 'ca-hal', country: 'Canada', place: 'Halifax', iso: '124', offsetMinutes: -240, lat: 44.65, lon: -63.57 },
  { id: 'us-et', country: 'United States', place: 'New York (Eastern)', iso: '840', offsetMinutes: -300, lat: 40.71, lon: -74.01 },
  { id: 'ca-tor', country: 'Canada', place: 'Toronto', iso: '124', offsetMinutes: -300, lat: 43.65, lon: -79.38 },
  { id: 'co', country: 'Colombia', place: 'Bogotá', iso: '170', offsetMinutes: -300, lat: 4.71, lon: -74.07 },
  { id: 'pe', country: 'Peru', place: 'Lima', iso: '604', offsetMinutes: -300, lat: -12.05, lon: -77.04 },
  { id: 'us-ct', country: 'United States', place: 'Chicago (Central)', iso: '840', offsetMinutes: -360, lat: 41.88, lon: -87.63 },
  { id: 'mx', country: 'Mexico', place: 'Mexico City', iso: '484', offsetMinutes: -360, lat: 19.43, lon: -99.13 },
  { id: 'us-mt', country: 'United States', place: 'Denver (Mountain)', iso: '840', offsetMinutes: -420, lat: 39.74, lon: -104.99 },
  { id: 'us-pt', country: 'United States', place: 'Los Angeles (Pacific)', iso: '840', offsetMinutes: -480, lat: 34.05, lon: -118.24 },
  { id: 'ca-van', country: 'Canada', place: 'Vancouver', iso: '124', offsetMinutes: -480, lat: 49.28, lon: -123.12 },
  { id: 'us-ak', country: 'United States', place: 'Anchorage (Alaska)', iso: '840', offsetMinutes: -540, lat: 61.22, lon: -149.9 },
  { id: 'us-hi', country: 'United States', place: 'Honolulu (Hawaii)', iso: '840', offsetMinutes: -600, lat: 21.31, lon: -157.86 },
];
