import React, { useState, useEffect } from 'react';
import { adminApi, seedsApi, statsApi, Seed, User } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, Edit, Plus, Users, Sprout, Database, Activity } from 'lucide-react';

export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'seeds' | 'users' | 'system'>('seeds');

    // Data State
    const [seeds, setSeeds] = useState<Seed[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Seed Modal State
    const [showSeedModal, setShowSeedModal] = useState(false);
    const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
    // Partial Form State (simplified for MVP)
    const [seedForm, setSeedForm] = useState<Partial<Seed>>({});

    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/'); // Protect
        }
        loadData();
    }, [user, navigate, activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'seeds') {
                const res = await seedsApi.getAll();
                setSeeds(res.data);
            } else if (activeTab === 'users') {
                const res = await adminApi.getAllUsers();
                setUsers(res.data);
            } else {
                const res = await statsApi.get();
                setStats(res.data);
            }
        } catch (err) {
            console.error("Failed to load admin data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSeed = async (id: number) => {
        if (!confirm("Are you sure? This will delete the plant from the catalog.")) return;
        try {
            await adminApi.deleteSeed(id);
            loadData();
        } catch (err) {
            alert("Failed to delete seed");
        }
    };

    const handleSaveSeed = async () => {
        try {
            if (editingSeed) {
                await adminApi.updateSeed(editingSeed.id, seedForm);
            } else {
                // Validate required
                if (!seedForm.seed_type || !seedForm.name || !seedForm.difficulty) {
                    alert("Type, Name and Difficulty are required");
                    return;
                }
                await adminApi.createSeed(seedForm as any);
            }
            setShowSeedModal(false);
            setSeedForm({});
            setEditingSeed(null);
            loadData();
        } catch (err) {
            console.error(err);
            alert("Failed to save seed");
        }
    };

    const openEditSeed = (seed: Seed) => {
        setEditingSeed(seed);
        setSeedForm(seed);
        setShowSeedModal(true);
    };

    const openNewSeed = () => {
        setEditingSeed(null);
        setSeedForm({
            seed_type: '', name: '', difficulty: 'Medium', growth_days: 10,
            avg_yield_grams: 500
        });
        setShowSeedModal(true);
    };

    if (!user || user.role !== 'admin') return <div className="p-10 text-center">Access Denied</div>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Console</h1>
                    <p className="text-gray-500">Super User Control Panel</p>
                </div>
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('seeds')} className={`px-4 py-2 rounded-md font-medium flex items-center ${activeTab === 'seeds' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Sprout className="w-4 h-4 mr-2" /> Catalog
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md font-medium flex items-center ${activeTab === 'users' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Users className="w-4 h-4 mr-2" /> Users
                    </button>
                    <button onClick={() => setActiveTab('system')} className={`px-4 py-2 rounded-md font-medium flex items-center ${activeTab === 'system' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Activity className="w-4 h-4 mr-2" /> System Stats
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-gray-200 rounded-lg"></div>
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* SEEDS TAB */}
                    {activeTab === 'seeds' && (
                        <div>
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Seed Catalog ({seeds.length})</h3>
                                <button onClick={openNewSeed} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center font-medium transition-colors shadow-sm shadow-green-100">
                                    <Plus className="w-4 h-4 mr-2" /> Add Plant
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                                        <tr>
                                            <th className="px-6 py-4">ID</th>
                                            <th className="px-6 py-4">Name</th>
                                            <th className="px-6 py-4">Type (Slug)</th>
                                            <th className="px-6 py-4">Difficulty</th>
                                            <th className="px-6 py-4">Growth Days</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {seeds.map(seed => (
                                            <tr key={seed.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-mono text-gray-400">#{seed.id}</td>
                                                <td className="px-6 py-4 font-bold text-gray-900">{seed.name}</td>
                                                <td className="px-6 py-4 text-gray-600">{seed.seed_type}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${seed.difficulty === 'Easy' ? 'bg-green-50 text-green-600' : seed.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                                                        {seed.difficulty}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium">{seed.growth_days} d</td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button onClick={() => openEditSeed(seed)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteSeed(seed.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div>
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="font-bold text-lg">Registered Users ({users.length})</h3>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4">Username</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-mono text-gray-400">#{u.id}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{u.username}</td>
                                            <td className="px-6 py-4 text-gray-600">{u.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {u.role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* SYSTEM TAB */}
                    {activeTab === 'system' && stats && (
                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                                <h4 className="text-blue-100 font-medium mb-2">Total Crops Grown</h4>
                                <p className="text-4xl font-bold">{stats.total_crops}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
                                <h4 className="text-green-100 font-medium mb-2">Total Yield (All Time)</h4>
                                <p className="text-4xl font-bold">{stats.total_yield_grams.toLocaleString()} <span className="text-lg opacity-80">g</span></p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                                <h4 className="text-purple-100 font-medium mb-2">Avg. Prediction Accuracy</h4>
                                <p className="text-4xl font-bold">{stats.avg_prediction_accuracy}%</p>
                            </div>

                            <div className="col-span-3 bg-gray-50 rounded-2xl p-6 border border-gray-200">
                                <h4 className="font-bold text-gray-700 mb-4 flex items-center"><Database className="w-5 h-5 mr-2" /> Technical Info</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex justify-between p-3 bg-white rounded-lg border border-gray-100">
                                        <span className="text-gray-500">Database Type</span>
                                        <span className="font-mono font-bold">SQLite</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-white rounded-lg border border-gray-100">
                                        <span className="text-gray-500">Active Crops</span>
                                        <span className="font-mono font-bold text-green-500">{stats.active_crops}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* SEED MODAL */}
            {showSeedModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h3 className="font-bold text-xl">{editingSeed ? `Edit ${editingSeed.name}` : 'New Plant'}</h3>
                            <button onClick={() => setShowSeedModal(false)} className="text-gray-400 hover:text-gray-700">&times;</button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Plant Name</label>
                                <input className="w-full p-2 border rounded-lg" value={seedForm.name} onChange={e => setSeedForm({ ...seedForm, name: e.target.value })} placeholder="e.g. Radish Rambo" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Slug (Unique ID)</label>
                                <input className="w-full p-2 border rounded-lg bg-gray-50" value={seedForm.seed_type} onChange={e => setSeedForm({ ...seedForm, seed_type: e.target.value })} placeholder="e.g. radish-rambo" disabled={!!editingSeed} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Difficulty</label>
                                <select className="w-full p-2 border rounded-lg" value={seedForm.difficulty} onChange={e => setSeedForm({ ...seedForm, difficulty: e.target.value })}>
                                    <option>Easy</option>
                                    <option>Medium</option>
                                    <option>Hard</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Growth Days</label>
                                <input type="number" className="w-full p-2 border rounded-lg" value={seedForm.growth_days} onChange={e => setSeedForm({ ...seedForm, growth_days: parseFloat(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Base Yield (g)</label>
                                <input type="number" className="w-full p-2 border rounded-lg" value={seedForm.avg_yield_grams} onChange={e => setSeedForm({ ...seedForm, avg_yield_grams: parseInt(e.target.value) })} />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                <textarea className="w-full p-2 border rounded-lg h-24" value={seedForm.description || ''} onChange={e => setSeedForm({ ...seedForm, description: e.target.value })} />
                            </div>
                            <div className="col-span-2 border-t pt-4 mt-2">
                                <h4 className="font-bold text-gray-900 mb-3">Growth Parameters</h4>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ideal Temp (°C)</label>
                                <input type="number" className="w-full p-2 border rounded-lg" value={seedForm.ideal_temp || ''} onChange={e => setSeedForm({ ...seedForm, ideal_temp: parseFloat(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ideal Humidity (%)</label>
                                <input type="number" className="w-full p-2 border rounded-lg" value={seedForm.ideal_humidity || ''} onChange={e => setSeedForm({ ...seedForm, ideal_humidity: parseFloat(e.target.value) })} />
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
                            <button onClick={() => setShowSeedModal(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg">Cancel</button>
                            <button onClick={handleSaveSeed} className="px-6 py-2 bg-green-500 text-white font-bold rounded-lg shadow-lg hover:bg-green-600 shadow-green-100">Save Plant</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
