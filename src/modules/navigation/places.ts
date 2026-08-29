import { Coordinates } from '../../types/vehicle';

export interface PresetDestination {
  id: string;
  name: string;
  category: 'Hospital / Emergency' | 'Transport' | 'Tech Park' | 'City Center';
  address: string;
  coordinates: Coordinates;
}

export const PRESET_DESTINATIONS: PresetDestination[] = [
  {
    id: 'dest-vizag-1',
    name: 'KGH (King George Hospital) Emergency Center',
    category: 'Hospital / Emergency',
    address: 'Maharanipeta, Visakhapatnam, Andhra Pradesh',
    coordinates: { latitude: 17.7082, longitude: 83.3033 },
  },
  {
    id: 'dest-vizag-2',
    name: 'Rushikonda IT SEZ & Tech Park',
    category: 'Tech Park',
    address: 'Hill No. 2, Rushikonda, Visakhapatnam',
    coordinates: { latitude: 17.7850, longitude: 83.3850 },
  },
  {
    id: 'dest-vizag-3',
    name: 'Visakhapatnam Railway Station & Bus Terminal',
    category: 'Transport',
    address: 'Station Road, Gnanapuram, Visakhapatnam',
    coordinates: { latitude: 17.7212, longitude: 83.2925 },
  },
  {
    id: 'dest-vizag-4',
    name: 'RK Beach & INS Kursura Submarine Promenade',
    category: 'City Center',
    address: 'Beach Road, Pandurangapuram, Visakhapatnam',
    coordinates: { latitude: 17.7120, longitude: 83.3021 },
  },
  {
    id: 'dest-vizag-5',
    name: 'Care Hospitals Super Specialty Center',
    category: 'Hospital / Emergency',
    address: 'AS Raja Complex, Waltair Main Rd, Visakhapatnam',
    coordinates: { latitude: 17.7285, longitude: 83.3150 },
  },
];
