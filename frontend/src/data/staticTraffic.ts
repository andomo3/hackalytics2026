export interface TrafficSegment {
  id: string;
  name: string;
  coordinates: [number, number][];
  congestionLevel: 'low' | 'moderate' | 'high' | 'severe';
  color: string;
  opacity: number;
}

export const LUMEN_FIELD_TRAFFIC: TrafficSegment[] = [
  {
    id: 'i5-northbound',
    name: 'I-5 Northbound',
    coordinates: [
      [47.591, -122.330],
      [47.595, -122.330],
      [47.600, -122.330],
      [47.605, -122.330]
    ],
    congestionLevel: 'severe',
    color: '#ef4444',
    opacity: 0.8
  },
  {
    id: 'stadium-way',
    name: 'Stadium Way',
    coordinates: [
      [47.593, -122.335],
      [47.595, -122.333],
      [47.597, -122.331]
    ],
    congestionLevel: 'high',
    color: '#f59e0b',
    opacity: 0.75
  },
  {
    id: '4th-avenue-s',
    name: '4th Avenue S',
    coordinates: [
      [47.590, -122.328],
      [47.593, -122.328],
      [47.596, -122.328],
      [47.599, -122.328]
    ],
    congestionLevel: 'moderate',
    color: '#eab308',
    opacity: 0.7
  },
  {
    id: 'edgar-martinez',
    name: 'Edgar Martinez Drive',
    coordinates: [
      [47.591, -122.333],
      [47.593, -122.331],
      [47.595, -122.329]
    ],
    congestionLevel: 'high',
    color: '#f59e0b',
    opacity: 0.75
  },
  {
    id: 'alaskan-way',
    name: 'Alaskan Way',
    coordinates: [
      [47.588, -122.337],
      [47.592, -122.337],
      [47.596, -122.337],
      [47.600, -122.337]
    ],
    congestionLevel: 'low',
    color: '#10b981',
    opacity: 0.6
  },
  {
    id: '1st-avenue-s',
    name: '1st Avenue S',
    coordinates: [
      [47.589, -122.334],
      [47.592, -122.334],
      [47.595, -122.334],
      [47.598, -122.334]
    ],
    congestionLevel: 'moderate',
    color: '#eab308',
    opacity: 0.7
  },
  {
    id: 's-royal-brougham',
    name: 'S Royal Brougham Way',
    coordinates: [
      [47.591, -122.337],
      [47.591, -122.334],
      [47.591, -122.331],
      [47.591, -122.328]
    ],
    congestionLevel: 'severe',
    color: '#ef4444',
    opacity: 0.8
  },
  {
    id: 'occidental-ave',
    name: 'Occidental Avenue S',
    coordinates: [
      [47.590, -122.332],
      [47.593, -122.332],
      [47.596, -122.332],
      [47.599, -122.332]
    ],
    congestionLevel: 'high',
    color: '#f59e0b',
    opacity: 0.75
  }
];
