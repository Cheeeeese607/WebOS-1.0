import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import axios from 'axios';
import { Location } from '../types';

interface Props {
  locations: Location[];
}

export default function ChinaMap({ locations }: Props) {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    async function fetchMap() {
      try {
        const res = await axios.get('/china.json');
        echarts.registerMap('china', res.data);
        setMapLoaded(true);
      } catch (err) {
        console.error("Failed to load China GeoJSON from local", err);
      }
    }
    fetchMap();
  }, []);

  if (!mapLoaded) {
    return <div className="h-full w-full flex items-center justify-center text-white/50 text-sm">正在加载地球数据...</div>;
  }

  const seriesData = locations.map(loc => ({
    name: loc.name,
    value: [loc.longitude, loc.latitude, 1], // The third value can be size/weight
    ...loc
  }));

  const options = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10,10,10,0.9)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff' },
      formatter: (params: any) => {
        const data = params.data;
        if (!data) return '';
        return `
          <div style="font-family: 'Inter', sans-serif;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${data.name} <span style="font-size: 12px; color: #aaa; margin-left:8px;">${data.date || ''}</span></div>
            <div style="font-size: 13px; color: #888;">${data.description || ''}</div>
          </div>
        `;
      }
    },
    geo: {
      map: 'china',
      roam: false, // disable drag and zoom to keep it clean like the design
      zoom: 1.2,
      label: {
        emphasis: { show: false }
      },
      itemStyle: {
        normal: {
          areaColor: 'rgba(255,255,255,0.02)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
        },
        emphasis: {
          areaColor: 'rgba(255,255,255,0.05)',
        }
      }
    },
    series: [
      {
        name: 'Footprints',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: seriesData,
        symbolSize: 8,
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke',
          scale: 4
        },
        itemStyle: {
          normal: {
            color: '#fbbf24', // amber-400
            shadowBlur: 10,
            shadowColor: '#fbbf24'
          }
        },
        zlevel: 1
      }
    ]
  };

  return (
    <ReactECharts
      option={options}
      style={{ minHeight: '400px', height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
