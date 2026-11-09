import Link from 'next/link';
import { MessageSquare, Laptop, Settings, User } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            FRIDAY
          </h1>
          <p className="text-gray-400 text-xl">Your unified personal AI assistant.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-cols-2 gap-6">
          <Link href="/assistant" className="group p-6 bg-gray-900 border border-gray-800 rounded-2xl hover:border-blue-500 transition-all cursor-pointer">
            <div className="mb-4 p-3 bg-blue-500/10 rounded-lg w-fit text-blue-500 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Assistant</h2>
            <p className="text-gray-500">Chat and voice interaction with FRIDAY.</p>
          </Link>

          <Link href="/devices" className="group p-6 bg-gray-900 border border-gray-800 rounded-2xl hover:border-purple-500 transition-all cursor-pointer">
            <div className="mb-4 p-3 bg-purple-500/10 rounded-lg w-fit text-purple-500 group-hover:scale-110 transition-transform">
              <Laptop className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Devices</h2>
            <p className="text-gray-500">Manage your connected Android and PC endpoints.</p>
          </Link>

          <Link href="/settings" className="group p-6 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-500 transition-all cursor-pointer">
            <div className="mb-4 p-3 bg-gray-500/10 rounded-lg w-fit text-gray-500 group-hover:scale-110 transition-transform">
              <Settings className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Settings</h2>
            <p className="text-gray-500">Configure your preferences and account.</p>
          </Link>

          <Link href="/profile" className="group p-6 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-500 transition-all cursor-pointer">
            <div className="mb-4 p-3 bg-gray-500/10 rounded-lg w-fit text-gray-500 group-hover:scale-110 transition-transform">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Profile</h2>
            <p className="text-gray-500">Manage your identity and security.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
