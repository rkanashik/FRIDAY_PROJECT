"use client";
import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Laptop, Plus, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function DeviceDashboard() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingCode, setPairingCode] = useState(null);
  const [error, setError] = useState(null);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://friday.rkanashik.workers.dev/v1/devices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setDevices(data.devices || []);
    } catch (err) {
      setError("Failed to load devices: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startPairing = async () => {
    setPairingLoading(true);
    setError(null);
    try {
      const response = await fetch('https://friday.rkanashik.workers.dev/v1/devices/pairing/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setPairingCode(data.pairingCode);
    } catch (err) {
      setError("Failed to generate pairing code: " + err.message);
    } finally {
      setPairingLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'android': return <Smartphone className="w-5 h-5" />;
      case 'windows': return <Laptop className="w-5 h-5" />;
      case 'linux': return <Monitor className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Connected Devices</h1>
          <p className="text-gray-400">Manage your authorized FRIDAY endpoints</p>
        </div>
        <button
          onClick={startPairing}
          disabled={pairingLoading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50"
        >
          {pairingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add Device
        </button>
      </div>

      {pairingCode && (
        <div className="mb-8 p-6 bg-blue-900/30 border border-blue-500/50 rounded-xl text-center animate-in fade-in zoom-in duration-300">
          <p className="text-blue-200 mb-2 text-sm uppercase tracking-wider font-semibold">Your Pairing Code</p>
          <div className="text-5xl font-mono font-bold text-white mb-4 tracking-widest">
            {pairingCode}
          </div>
          <p className="text-blue-300 text-sm">Enter this code on your new device to pair it.</p>
          <button
            onClick={() => setPairingCode(null)}
            className="mt-4 text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-200">
          <AlertCircle className="w-5 h-5 text-red-500" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p>Loading devices...</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-2xl">
          <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No devices connected</h3>
          <p className="text-gray-500 mb-6">Pair a device to start controlling your environment.</p>
          <button
            onClick={startPairing}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-full transition-colors"
          >
            Add Your First Device
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.map((device) => (
            <div key={device.id} className="p-4 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-between hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-800 rounded-lg text-blue-400">
                  {getPlatformIcon(device.platform)}
                </div>
                <div>
                  <h4 className="text-white font-medium">{device.device_name}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="capitalize">{device.platform}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-gray-600'}`} />
                      {device.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchDevices}
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                  title="Refresh status"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
