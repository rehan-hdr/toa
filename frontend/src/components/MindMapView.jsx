import React, { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import axios from 'axios';
import { Expand, X } from 'lucide-react';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';

const MindMapView = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const fgRef = useRef();

  useEffect(() => {
    fetchGraph();
  }, []);

  const fetchGraph = async () => {
    try {
      const res = await axios.get('/api/graph');
      // Set random 3D coordinates
      const nodes = res.data.nodes.map(node => ({
          ...node,
          x: Math.random() * 100 - 50,
          y: Math.random() * 100 - 50,
          z: Math.random() * 100 - 50
      }));
      setGraphData({ ...res.data, nodes });
    } catch (error) {
      console.error('Error fetching graph data:', error);
    }
  };



  const getNodeColor = (node) => {
    if (node.group === 1) return '#f97316'; // Task - Orange
    if (node.group === 2) return '#eab308'; // Note - Yellow
    if (node.group === 3) return '#ec4899'; // Journal - Pink
    return '#64748b';
  };

  useEffect(() => {
    // Add Crystals to Background
    if (fgRef.current) {
      const scene = fgRef.current.scene();
      const crystals = [];
      const geometry = new THREE.OctahedronGeometry(1);
      const material = new THREE.MeshPhysicalMaterial({
        color: 0xfb923c, // Orange-400
        transparent: true,
        opacity: 0.3,
        transmission: 0.9,
        roughness: 0,
        metalness: 0.5,
        flatShading: true
      });

      for (let i = 0; i < 50; i++) {
        const mesh = new THREE.Mesh(geometry, material);
        // Random position far away
        const dist = 150 + Math.random() * 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        mesh.position.x = dist * Math.sin(phi) * Math.cos(theta);
        mesh.position.y = dist * Math.sin(phi) * Math.sin(theta);
        mesh.position.z = dist * Math.cos(phi);
        
        mesh.scale.setScalar(2 + Math.random() * 5);
        mesh.rotation.x = Math.random() * Math.PI;
        mesh.rotation.y = Math.random() * Math.PI;
        
        scene.add(mesh);
        crystals.push({ mesh, rotSpeed: (Math.random() - 0.5) * 0.01 });
      }
      
      // Animation Loop for crystals
      const animate = () => {
        crystals.forEach(({ mesh, rotSpeed }) => {
            mesh.rotation.x += rotSpeed;
            mesh.rotation.y += rotSpeed;
        });
        requestAnimationFrame(animate);
      };
      animate();
    }
  }, []);

  return (
    <div className="h-full w-full relative overflow-hidden">
        {/* Dynamic Gradient Background */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-orange-950/20 to-slate-900 animate-gradient-slow" 
             style={{ 
                 backgroundSize: '400% 400%',
                 animation: 'gradientBG 15s ease infinite'
             }}
        />

      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-2 drop-shadow-md">Nexus Mind Map</h2>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></span>
            <span className="text-slate-200 font-medium">Tasks</span>
          </div>
          <div className="flex items-center gap-2">
             <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]"></span>
             <span className="text-slate-200 font-medium">Notes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"></span>
            <span className="text-slate-200 font-medium">Journal</span>
          </div>
        </div>
      </div>

      {/* Details Panel */}
      {selectedNode && (
        <div className="absolute right-4 top-4 bottom-4 w-80 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl p-6 z-20 shadow-2xl overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
              selectedNode.group === 1 ? 'bg-orange-500/10 text-orange-400' :
              selectedNode.group === 2 ? 'bg-yellow-500/10 text-yellow-500' :
              'bg-pink-500/10 text-pink-400'
            }`}>
              {selectedNode.group === 1 ? 'TASK' : selectedNode.group === 2 ? 'NOTE' : 'JOURNAL'}
            </span>
            <button 
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-4">{selectedNode.title}</h3>
          
          <div className="prose prose-invert prose-sm">
             <p className="text-slate-300 whitespace-pre-wrap">{selectedNode.desc}</p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
             <p className="text-xs text-slate-500">
                Relevance Value: {selectedNode.val}
             </p>
          </div>
        </div>
      )}

      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeColor={getNodeColor}
        nodeVal="val"
        showNavInfo={false}
        
        // Links
        linkColor={() => '#ffffff'} 
        linkWidth={link => Math.sqrt(link.value) * 0.5}
        linkOpacity={0.15}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={1}
        linkDirectionalParticleSpeed={0.005}

        // 3D Objects (Orb + Label)
        nodeThreeObject={node => {
          const group = new THREE.Group();
          
          // 1. Orb
          const radius = 4 + (node.val * 1.5);
          const geometry = new THREE.SphereGeometry(radius, 32, 32);
          const material = new THREE.MeshPhysicalMaterial({ 
            color: getNodeColor(node),
            transparent: true,
            opacity: 0.9,
            metalness: 0.1,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
          });
          const sphere = new THREE.Mesh(geometry, material);
          group.add(sphere);
          
          // Glow Sprite
          // (Simulated glow using generic material or just reliance on bloom if post-processing was enabled, but sticking to simple material for now)

          // 2. Label
          const sprite = new SpriteText(node.title);
          sprite.color = 'rgba(255, 255, 255, 0.9)'; 
          sprite.textHeight = 3;
          sprite.position.set(0, -radius - 5, 0); 
          sprite.fontFace = "Inter, system-ui, sans-serif";
          group.add(sprite);

          return group;
        }}
        
        // Interactions
        onNodeClick={node => {
           setSelectedNode(node);
           const distance = 40;
           const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
           fgRef.current.cameraPosition(
             { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, 
             node, 
             3000
           );
        }}
        backgroundColor="rgba(0,0,0,0)" // Transparent for CSS background
      />
    </div>
  );
};

export default MindMapView;
