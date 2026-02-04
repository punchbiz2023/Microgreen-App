import { useState, useEffect } from 'react';
import { adminApi, seedsApi, statsApi, Seed, User } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, Edit, Plus, Users, Sprout, Database, Activity } from 'lucide-react';

export default function AdminDashboard() {
    const { t } = useTranslation();
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
        if (!confirm(t('admin.delete_q'))) return;
        try {
            await adminApi.deleteSeed(id);
            loadData();
        } catch (err) {
            alert(t('admin.fail_delete'));
        }
    };

    const handleSaveSeed = async () => {
        try {
            if (editingSeed) {
                await adminApi.updateSeed(editingSeed.id, seedForm);
            } else {
                // Validate required
                if (!seedForm.seed_type || !seedForm.name || !seedForm.difficulty) {
                    alert(t('admin.required_fields'));
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
            alert(t('admin.fail_save'));
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
            seed_type: '', name: '', difficulty: 'Medium', harvest_days: 10,
            avg_yield_grams: 500
        });
        setShowSeedModal(true);
    };

    if (!user || user.role !== 'admin') return <div className="p-10 text-center">{t('admin.access_denied')}</div>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('admin.console')}</h1>
                    <p className="text-gray-500">{t('admin.control_panel')}</p>
                </div>
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('seeds')} className={`px-4 py-2 rounded-md font-medium flex items-center ${activeTab === 'seeds' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Sprout className="w-4 h-4 mr-2" /> {t('admin.catalog')}
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md font-medium flex items-center ${activeTab === 'users' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Users className="w-4 h-4 mr-2" /> {t('admin.users')}
                    </button>
                    <button onClick={() => setActiveTab('system')} className={`px-4 py-2 rounded-md font-medium flex items-center ${activeTab === 'system' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Activity className="w-4 h-4 mr-2" /> {t('admin.system_stats')}
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
                                <h3 className="font-bold text-lg">{t('admin.seed_catalog', { count: seeds.length })}</h3>
                                <button onClick={openNewSeed} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center font-medium transition-colors shadow-sm shadow-green-100">
                                    <Plus className="w-4 h-4 mr-2" /> {t('admin.add_plant')}
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                                        <tr>
                                            <th className="px-6 py-4">{t('admin.id')}</th>
                                            <th className="px-6 py-4">{t('admin.name')}</th>
                                            <th className="px-6 py-4">{t('admin.type_slug')}</th>
                                            <th className="px-6 py-4">{t('admin.difficulty')}</th>
                                            <th className="px-6 py-4">{t('admin.growth_days')}</th>
                                            <th className="px-6 py-4 text-right">{t('admin.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {seeds.map(seed => (
                                            <tr key={seed.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-mono text-gray-400">#{seed.id}</td>
                                                <td className="px-6 py-4 font-bold text-gray-900">{t(`seeds.${seed.seed_type}.name`, { defaultValue: seed.name })}</td>
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
                                <h3 className="font-bold text-lg">{t('admin.registered_users', { count: users.length })}</h3>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="px-6 py-4">{t('admin.id')}</th>
                                        <th className="px-6 py-4">{t('auth.username')}</th>
                                        <th className="px-6 py-4">{t('auth.email')}</th>
                                        <th className="px-6 py-4">{t('admin.role')}</th>
                                        <th className="px-6 py-4">{t('admin.joined')}</th>
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
                                <h4 className="text-blue-100 font-medium mb-2">{t('admin.total_crops')}</h4>
                                <p className="text-4xl font-bold">{stats.total_crops}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
                                <h4 className="text-green-100 font-medium mb-2">{t('admin.total_yield_all_time')}</h4>
                                <p className="text-4xl font-bold">{stats.total_yield_grams.toLocaleString()} <span className="text-lg opacity-80">g</span></p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                                <h4 className="text-purple-100 font-medium mb-2">{t('admin.avg_accuracy')}</h4>
                                <p className="text-4xl font-bold">{stats.avg_prediction_accuracy}%</p>
                            </div>

                            <div className="col-span-3 bg-gray-50 rounded-2xl p-6 border border-gray-200">
                                <h4 className="font-bold text-gray-700 mb-4 flex items-center"><Database className="w-5 h-5 mr-2" /> {t('admin.tech_info')}</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex justify-between p-3 bg-white rounded-lg border border-gray-100">
                                        <span className="text-gray-500">{t('admin.db_type')}</span>
                                        <span className="font-mono font-bold">SQLite</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-white rounded-lg border border-gray-100">
                                        <span className="text-gray-500">{t('admin.active_crops_label')}</span>
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
                            <h3 className="font-bold text-xl">{editingSeed ? t('admin.edit_plant', { name: t(`seeds.${editingSeed.seed_type}.name`, { defaultValue: editingSeed.name }) }) : t('admin.new_plant')}</h3>
                            <button onClick={() => setShowSeedModal(false)} className="text-gray-400 hover:text-gray-700">&times;</button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.plant_name')}</label>
                                <input className="w-full p-2 border rounded-lg" value={seedForm.name || ''} onChange={e => setSeedForm({ ...seedForm, name: e.target.value })} placeholder="e.g. Radish Rambo" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.latin_name')}</label>
                                <input className="w-full p-2 border rounded-lg italic" value={seedForm.latin_name || ''} onChange={e => setSeedForm({ ...seedForm, latin_name: e.target.value })} placeholder="e.g. Raphanus sativus" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.slug')}</label>
                                <input className="w-full p-2 border rounded-lg bg-gray-50" value={seedForm.seed_type || ''} onChange={e => setSeedForm({ ...seedForm, seed_type: e.target.value })} placeholder="e.g. radish-rambo" disabled={!!editingSeed} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.difficulty')}</label>
                                <select className="w-full p-2 border rounded-lg" value={seedForm.difficulty} onChange={e => setSeedForm({ ...seedForm, difficulty: e.target.value })}>
                                    <option>{t('common.difficulty_easy', { defaultValue: 'Easy' })}</option>
                                    <option>{t('common.difficulty_medium', { defaultValue: 'Medium' })}</option>
                                    <option>{t('common.difficulty_hard', { defaultValue: 'Hard' })}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.growth_days_input')}</label>
                                <input type="number" className="w-full p-2 border rounded-lg"
                                    value={seedForm.harvest_days ?? seedForm.growth_days ?? ''}
                                    onChange={e => setSeedForm({ ...seedForm, harvest_days: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    placeholder="10" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.base_yield')}</label>
                                <input type="number" className="w-full p-2 border rounded-lg" value={seedForm.avg_yield_grams || ''} onChange={e => setSeedForm({ ...seedForm, avg_yield_grams: e.target.value ? parseInt(e.target.value) : undefined })} />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.description_short')}</label>
                                <textarea className="w-full p-2 border rounded-lg h-20" value={seedForm.description || ''} onChange={e => setSeedForm({ ...seedForm, description: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.full_care')}</label>
                                <textarea className="w-full p-2 border rounded-lg h-20 placeholder:italic" value={seedForm.care_instructions || ''} onChange={e => setSeedForm({ ...seedForm, care_instructions: e.target.value })} placeholder="Detailed steps for growing..." />
                            </div>
                            <div className="col-span-2 border-t pt-4 mt-2">
                                <h4 className="font-bold text-gray-900 mb-3">{t('admin.parameters')}</h4>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.ideal_temp')}</label>
                                <input type="number" className="w-full p-2 border rounded-lg" value={seedForm.ideal_temp || ''} onChange={e => setSeedForm({ ...seedForm, ideal_temp: e.target.value ? parseFloat(e.target.value) : undefined })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.ideal_humidity')}</label>
                                <input type="number" className="w-full p-2 border rounded-lg" value={seedForm.ideal_humidity ?? ''} onChange={e => setSeedForm({ ...seedForm, ideal_humidity: e.target.value ? parseFloat(e.target.value) : undefined })} />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.taste')}</label>
                                <input className="w-full p-2 border rounded-lg" value={seedForm.taste || ''} onChange={e => setSeedForm({ ...seedForm, taste: e.target.value })} placeholder="e.g. Peppery, Spicy" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.nutrition')}</label>
                                <input className="w-full p-2 border rounded-lg" value={seedForm.nutrition || ''} onChange={e => setSeedForm({ ...seedForm, nutrition: e.target.value })} placeholder="e.g. Vitamins A, C, K" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.pros')}</label>
                                <textarea className="w-full p-2 border rounded-lg h-16" value={seedForm.pros || ''} onChange={e => setSeedForm({ ...seedForm, pros: e.target.value })} placeholder="What is it good for?" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.cons')}</label>
                                <textarea className="w-full p-2 border rounded-lg h-16" value={seedForm.cons || ''} onChange={e => setSeedForm({ ...seedForm, cons: e.target.value })} placeholder="Any drawbacks/difficulties?" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.fert_tips')}</label>
                                <textarea className="w-full p-2 border rounded-lg h-20" value={seedForm.fertilizer_info || ''} onChange={e => setSeedForm({ ...seedForm, fertilizer_info: e.target.value })} placeholder="Expert guidance on nutrients..." />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.growth_tips')}</label>
                                <textarea className="w-full p-2 border rounded-lg h-20" value={seedForm.growth_tips || ''} onChange={e => setSeedForm({ ...seedForm, growth_tips: e.target.value })} placeholder="Pro secrets for success..." />
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
                            <button onClick={() => setShowSeedModal(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg">{t('common.cancel')}</button>
                            <button onClick={handleSaveSeed} className="px-6 py-2 bg-green-500 text-white font-bold rounded-lg shadow-lg hover:bg-green-600 shadow-green-100">{t('admin.save_plant')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
