
import React, { useState } from 'react';
import { Coordinates, GameVersion } from '../types';
import { ZORK_MAP_DATA } from '../services/mapData';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoordinates: Coordinates | undefined;
  visitedLocations: Coordinates[] | undefined;
  language: 'ja' | 'en';
  gameVersion: GameVersion;
}

export const MapModal: React.FC<MapModalProps> = ({ 
  isOpen, 
  onClose, 
  currentCoordinates,
  visitedLocations = [],
  language,
  gameVersion
}) => {
  const [viewLayer, setViewLayer] = useState<'surface' | 'underground'>('surface');

  if (!isOpen) return null;

  // Coordinate adjustments for rendering
  // Grid size: 40px
  const GRID_SIZE = 40;
  const CENTER_X = 300; // Canvas center
  const CENTER_Y = 200;

  // Function to find location name from static database
  const getLocationName = (coords: Coordinates) => {
    const knownData = ZORK_MAP_DATA[gameVersion];
    if (!knownData) return language === 'ja' ? "未踏の地" : "Unknown";

    const match = knownData.find(n => 
      n.coords.x === coords.x && 
      n.coords.y === coords.y && 
      n.coords.floor === coords.floor
    );

    if (match) {
      return language === 'ja' ? match.nameJa : match.nameEn;
    }
    
    // Fallback for Remix or generic locations
    return language === 'ja' ? `エリア ${coords.x},${coords.y}` : `Area ${coords.x},${coords.y}`;
  };

  // Filter visited locations based on current view layer
  const visibleNodes = visitedLocations.filter(coords => {
    if (viewLayer === 'surface') return coords.floor >= 0;
    return coords.floor < 0;
  });

  const playerOnCurrentLayer = currentCoordinates 
    ? (viewLayer === 'surface' ? currentCoordinates.floor >= 0 : currentCoordinates.floor < 0)
    : false;

  const getScreenCoords = (x: number, y: number) => {
    // Invert Y for screen coords (up is negative Y in canvas)
    return {
      sx: CENTER_X + (x * GRID_SIZE),
      sy: CENTER_Y - (y * GRID_SIZE)
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl border-2 border-green-800 bg-zinc-950 shadow-[0_0_30px_rgba(34,197,94,0.15)] flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-green-900 bg-green-900/10">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-green-400 tracking-wider uppercase font-mono">
              MAP SYSTEM - {gameVersion}
            </h2>
            <div className="flex bg-black border border-green-800 rounded overflow-hidden">
               <button 
                 onClick={() => setViewLayer('surface')}
                 className={`px-3 py-1 text-xs font-mono transition-colors ${viewLayer === 'surface' ? 'bg-green-800 text-white' : 'text-green-600 hover:bg-green-900/30'}`}
               >
                 SURFACE
               </button>
               <button 
                 onClick={() => setViewLayer('underground')}
                 className={`px-3 py-1 text-xs font-mono transition-colors ${viewLayer === 'underground' ? 'bg-green-800 text-white' : 'text-green-600 hover:bg-green-900/30'}`}
               >
                 UNDERGROUND
               </button>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-green-600 hover:text-green-300 font-mono text-xl"
          >
            [X]
          </button>
        </div>

        {/* Map Viewport */}
        <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center cursor-move">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ 
                 backgroundImage: 'linear-gradient(to right, #22c55e 1px, transparent 1px), linear-gradient(to bottom, #22c55e 1px, transparent 1px)',
                 backgroundSize: '40px 40px',
                 backgroundPosition: 'center'
               }}>
          </div>

          <svg width="600" height="400" viewBox="0 0 600 400" className="w-full h-full max-w-[600px] max-h-[400px]">
             
             {/* Draw Visited Nodes */}
             {visibleNodes.map((coords, i) => {
               const { sx, sy } = getScreenCoords(coords.x, coords.y);
               const isCurrent = currentCoordinates && 
                                 currentCoordinates.x === coords.x && 
                                 currentCoordinates.y === coords.y && 
                                 currentCoordinates.floor === coords.floor;
               
               return (
                 <g key={i}>
                   {/* Connection lines would go here but simple grid is cleaner for now */}
                   <rect 
                     x={sx - 16} y={sy - 16} 
                     width="32" height="32" 
                     className={`fill-black stroke-2 ${isCurrent ? 'stroke-green-300 animate-pulse' : 'stroke-green-800'}`}
                   />
                   <text 
                     x={sx} y={sy + 30} 
                     textAnchor="middle" 
                     className="fill-green-700 text-[8px] font-mono uppercase"
                   >
                     {getLocationName(coords)}
                   </text>
                 </g>
               );
             })}

             {/* Player Marker Logic */}
             {playerOnCurrentLayer && currentCoordinates && (
               <g transform={`translate(${getScreenCoords(currentCoordinates.x, currentCoordinates.y).sx}, ${getScreenCoords(currentCoordinates.x, currentCoordinates.y).sy})`}>
                  <circle r="6" className="fill-green-400 animate-ping opacity-75" />
                  <circle r="4" className="fill-green-100" />
               </g>
             )}
          </svg>
          
          <div className="absolute bottom-2 right-2 text-[10px] text-green-800 font-mono">
             AUTO-MAPPING ENABLED
             <br/>
             COORDS: {currentCoordinates ? `${currentCoordinates.x}, ${currentCoordinates.y}, ${currentCoordinates.floor}` : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};