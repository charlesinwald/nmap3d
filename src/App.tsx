import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import "./App.css";

interface PortInfo {
  port: number;
  state: string;
  service: string;
}

interface DeviceInfo {
  ip: string;
  hostname: string;
  ports: PortInfo[];
}

interface BoxProps {
  position: [number, number, number];
  color: string;
  label: string;
  onHover: (info: DeviceInfo | PortInfo | null) => void;
}

function Box({ position, color, label, onHover }: BoxProps) {
  return (
    <group>
      <mesh
        position={position}
        onPointerOver={() => onHover({ label } as any)}
        onPointerOut={() => onHover(null)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[position[0], position[1] - 0.75, position[2]]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

interface ScanResultProps {
  result: string;
  mode: 'devices' | 'ports';
  onHover: (info: DeviceInfo | PortInfo | null) => void;
}

function ScanResult({ result, mode, onHover }: ScanResultProps) {
  const devices = useMemo(() => {
    // Parse the result string to extract device information
    // This is a simplified example and may need to be adjusted based on your actual Nmap output format
    const deviceRegex = /Nmap scan report for ([\S]+) \(([\d.]+)\)/g;
    const portRegex = /(\d+)\/tcp\s+(\w+)\s+(\w+)/g;
    
    const devices: DeviceInfo[] = [];
    let currentDevice: DeviceInfo | null = null;
    
    for (const line of result.split('\n')) {
      const deviceMatch = deviceRegex.exec(line);
      if (deviceMatch) {
        if (currentDevice) devices.push(currentDevice);
        currentDevice = {
          hostname: deviceMatch[1],
          ip: deviceMatch[2],
          ports: []
        };
      } else if (currentDevice) {
        const portMatch = portRegex.exec(line);
        if (portMatch) {
          currentDevice.ports.push({
            port: parseInt(portMatch[1]),
            state: portMatch[2],
            service: portMatch[3]
          });
        }
      }
    }
    if (currentDevice) devices.push(currentDevice);
    
    return devices;
  }, [result]);

  const boxes = useMemo(() => {
    if (mode === 'devices') {
      return devices.map((device, index) => {
        const x = (index % 5) * 2 - 4;
        const z = Math.floor(index / 5) * 2 - 4;
        const color = device.ports.some(port => port.state === 'open') ? 'green' : 'red';
        return { position: [x, 0, z] as [number, number, number], color, label: device.hostname || device.ip, info: device };
      });
    } else {
      return devices.flatMap((device, deviceIndex) => 
        device.ports.map((port, portIndex) => {
          const x = (deviceIndex % 5) * 2 - 4;
          const z = Math.floor(deviceIndex / 5) * 2 - 4;
          const y = portIndex * 1.5;
          const color = port.state === 'open' ? 'green' : 'red';
          return { position: [x, y, z] as [number, number, number], color, label: port.port.toString(), info: { ...port, ip: device.ip } };
        })
      );
    }
  }, [devices, mode]);

  return (
    <>
      {boxes.map((box, index) => (
        <Box key={index} position={box.position} color={box.color} label={box.label} onHover={() => onHover(box.info)} />
      ))}
    </>
  );
}

function App() {
  const [target, setTarget] = useState<string>("");
  const [scanResult, setScanResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hoveredInfo, setHoveredInfo] = useState<DeviceInfo | PortInfo | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mode, setMode] = useState<'devices' | 'ports'>('devices');

  const runScan = async () => {
    setIsLoading(true);
    try {
      const result = await invoke<{ output: string }>("run_nmap_scan", { target });
      setScanResult(result.output);
    } catch (error) {
      console.error("Scan failed:", error);
      setScanResult("Scan failed. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-retrowave-bg text-retrowave-text">
      {/* Top Bar */}
      <div className="bg-retrowave-primary bg-opacity-20 p-4 shadow-lg shadow-retrowave-primary/50">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-retrowave-secondary">3D Nmap GUI</h1>
          <nav>
            <ul className="flex space-x-4">
              <li><a href="#" className="hover:text-retrowave-accent transition-colors duration-200">Home</a></li>
              <li><a href="#" className="hover:text-retrowave-accent transition-colors duration-200">Scan</a></li>
              <li><a href="#" className="hover:text-retrowave-accent transition-colors duration-200">Results</a></li>
              <li><a href="#" className="hover:text-retrowave-accent transition-colors duration-200">Settings</a></li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-retrowave-secondary mb-4">
          Welcome to 3D Nmap GUI
        </h1>
        <div className="w-full max-w-md">
          <input
            type="text"
            value={target}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTarget(e.target.value)}
            placeholder="Enter target IP or hostname"
            className="w-full p-2 mb-4 bg-retrowave-bg border border-retrowave-primary text-retrowave-text"
          />
          <button
            onClick={runScan}
            disabled={isLoading}
            className="w-full p-2 bg-retrowave-primary text-retrowave-text hover:bg-retrowave-accent transition-colors duration-200"
          >
            {isLoading ? "Scanning..." : "Run Nmap Scan"}
          </button>
        </div>
        <div className="mt-4">
          <button
            onClick={() => setMode('devices')}
            className={`px-4 py-2 mr-2 ${mode === 'devices' ? 'bg-retrowave-accent' : 'bg-retrowave-primary'} text-retrowave-text`}
          >
            Show Devices
          </button>
          <button
            onClick={() => setMode('ports')}
            className={`px-4 py-2 ${mode === 'ports' ? 'bg-retrowave-accent' : 'bg-retrowave-primary'} text-retrowave-text`}
          >
            Show Ports
          </button>
        </div>
        {scanResult && (
          <div className="mt-4 w-full max-w-4xl flex space-x-4">
            <div className="w-2/3 h-96">
              <Canvas camera={{ position: [0, 5, 10] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <ScanResult result={scanResult} mode={mode} onHover={setHoveredInfo} />
                <OrbitControls />
              </Canvas>
            </div>
            <div className="w-1/3 h-96 overflow-auto bg-retrowave-bg border border-retrowave-primary p-4">
              <pre className="text-xs text-retrowave-text">{scanResult}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Hover Popup */}
      {hoveredInfo && (
        <div 
          className="absolute bg-retrowave-primary bg-opacity-90 border border-retrowave-accent p-4 rounded-lg shadow-lg"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y + 10,
            zIndex: 1000,
          }}
        >
          {('hostname' in hoveredInfo) ? (
            <>
              <h3 className="text-lg font-bold text-retrowave-secondary">Device Details</h3>
              <p>IP: {hoveredInfo.ip}</p>
              <p>Hostname: {hoveredInfo.hostname || 'N/A'}</p>
              <h4 className="text-md font-semibold mt-2">Open Ports:</h4>
              <ul>
                {hoveredInfo.ports.filter(port => port.state === 'open').map(port => (
                  <li key={port.port}>{port.port} ({port.service})</li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-retrowave-secondary">Port Details</h3>
              <p>IP: {hoveredInfo.ip}</p>
              <p>Port: {hoveredInfo.port}</p>
              <p>State: {hoveredInfo.state}</p>
              <p>Service: {hoveredInfo.service}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
