import { useEffect, useState } from 'react';
import { Users, Shield, UserCog, Search, Plus, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { userService } from '../services/userService';
import { shiftService } from '../services/shiftService';
import type { User, Shift } from '../types';

export const Staff = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'users' | 'shifts'>('users');
    const [isAddUserOpen, setIsAddUserOpen] = useState(false); // Placeholder for modal

    // New User Form State
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');

    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [staffData, shiftsData] = await Promise.all([
                userService.getAllStaff(),
                shiftService.getAllShifts()
            ]);
            setUsers(staffData);
            setShifts(shiftsData);
        } catch (error) {
            console.error('Error fetching staff data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleToggle = async (user: User) => {
        const newRole = user.role === 'admin' ? 'staff' : 'admin';
        try {
            setUsers(users.map(u => u.uid === user.uid ? { ...u, role: newRole } : u));
            await userService.updateUserRole(user.uid, newRole);
        } catch (error) {
            console.error('Error updating role:', error);
            setUsers(users.map(u => u.uid === user.uid ? { ...u, role: user.role } : u));
            alert('שגיאה בעדכון הרשאה');
        }
    };

    const handleStatusToggle = async (user: User) => {
        const newStatus = !user.isActive;
        try {
            setUsers(users.map(u => u.uid === user.uid ? { ...u, isActive: newStatus } : u));
            await userService.updateUserStatus(user.uid, newStatus);
        } catch (error) {
            console.error('Error updating status:', error);
            setUsers(users.map(u => u.uid === user.uid ? { ...u, isActive: user.isActive } : u));
            alert('שגיאה בעדכון סטטוס');
        }
    };

    const handleAddUser = async () => {
        if (!newUserName || !newUserEmail) return;

        try {
            setLoading(true);
            await userService.createUser(newUserEmail, newUserName, 'staff');

            // Refresh list
            const staff = await userService.getAllStaff();
            setUsers(staff);

            setIsAddUserOpen(false);
            setNewUserName('');
            setNewUserEmail('');
            alert(`המשתמש ${newUserName} נוצר בהצלחה עם סיסמה ראשונית: 123456`);
        } catch (error: any) {
            console.error('Error adding user:', error);
            if (error.code === 'auth/email-already-in-use') {
                alert('כתובת האימייל כבר קיימת במערכת');
            } else {
                alert('שגיאה ביצירת משתמש: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = async () => {
        if (!editingUser) return;
        try {
            setLoading(true);
            await userService.updateUser(editingUser.uid, {
                displayName: editingUser.displayName,
                email: editingUser.email
            });

            setUsers(users.map(u => u.uid === editingUser.uid ? editingUser : u));
            setEditingUser(null);
        } catch (error) {
            console.error('Error updating user:', error);
            alert('שגיאה בעדכון פרטי משתמש');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-charcoal">ניהול צוות</h1>
                    <p className="text-gray-500 mt-1">ניהול משתמשים, הרשאות ושעות עבודה</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white p-1 rounded-xl border border-gray-200 flex">
                        <button
                            onClick={() => setView('users')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'users' ? 'bg-gold text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Users size={16} className="inline-block ml-2" />
                            עובדים
                        </button>
                        <button
                            onClick={() => setView('shifts')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'shifts' ? 'bg-gold text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Clock size={16} className="inline-block ml-2" />
                            שעות עבודה
                        </button>
                    </div>
                    {view === 'users' && (
                        <button
                            onClick={() => setIsAddUserOpen(true)}
                            className="bg-charcoal text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-black transition-colors"
                        >
                            <Plus size={20} />
                            הוסף עובד
                        </button>
                    )}
                </div>
            </div>

            {view === 'users' ? (
                <>
                    <div className="relative w-64">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="חיפוש איש צוות..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                        />
                    </div>

                    <div className="glass rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-right py-4 px-6 font-medium text-gray-500">שם מלא</th>
                                    <th className="text-right py-4 px-6 font-medium text-gray-500">אימייל</th>
                                    <th className="text-right py-4 px-6 font-medium text-gray-500">תפקיד</th>
                                    <th className="text-right py-4 px-6 font-medium text-gray-500">סטטוס</th>
                                    <th className="text-center py-4 px-6 font-medium text-gray-500">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map(user => (
                                    <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gold/10 text-gold-dark flex items-center justify-center font-bold">
                                                    {user.displayName.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-900">{user.displayName}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600">{user.email}</td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {user.role === 'admin' ? <Shield size={12} /> : <UserCog size={12} />}
                                                {user.role === 'admin' ? 'מנהל מערכת' : 'צוות'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => handleStatusToggle(user)}
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${user.isActive !== false
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    }`}
                                            >
                                                {user.isActive !== false ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                {user.isActive !== false ? 'פעיל' : 'מושהה'}
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="text-sm text-gray-500 hover:text-gold font-medium"
                                            >
                                                ערוך
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button
                                                onClick={() => handleRoleToggle(user)}
                                                className="text-sm text-gold hover:underline font-medium"
                                            >
                                                שנה הרשאה
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="glass rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-right py-4 px-6 font-medium text-gray-500">עובד</th>
                                <th className="text-right py-4 px-6 font-medium text-gray-500">התחלה</th>
                                <th className="text-right py-4 px-6 font-medium text-gray-500">סיום</th>
                                <th className="text-right py-4 px-6 font-medium text-gray-500">סה״כ שעות</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {shifts.map(shift => {
                                const start = shift.startTime instanceof Date ? shift.startTime : (shift.startTime as any).toDate();
                                const end = shift.endTime ? (shift.endTime instanceof Date ? shift.endTime : (shift.endTime as any).toDate()) : null;
                                const duration = end ? ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(2) : '-';

                                return (
                                    <tr key={shift.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6 font-medium text-gray-900">{shift.employeeName}</td>
                                        <td className="py-4 px-6 text-gray-600">
                                            {new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(start)}
                                        </td>
                                        <td className="py-4 px-6 text-gray-600">
                                            {end ? new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(end) : <span className="text-green-600 font-medium">פעיל כעת</span>}
                                        </td>
                                        <td className="py-4 px-6 font-bold text-charcoal">{duration}</td>
                                    </tr>
                                );
                            })}
                            {shifts.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-gray-400">
                                        <Clock size={48} className="mx-auto mb-2 opacity-20" />
                                        <p>לא נמצאו משמרות</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add User Modal */}
            {isAddUserOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">הוספת עובד חדש</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                                <input
                                    type="text"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                                <input
                                    type="email"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setIsAddUserOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
                                >
                                    ביטול
                                </button>
                                <button
                                    onClick={handleAddUser}
                                    className="px-4 py-2 bg-gold text-white rounded-xl hover:bg-gold-dark"
                                >
                                    הוסף
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">עריכת פרטי עובד</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                                <input
                                    type="text"
                                    value={editingUser.displayName}
                                    onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                                <input
                                    type="email"
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
                                >
                                    ביטול
                                </button>
                                <button
                                    onClick={handleEditUser}
                                    className="px-4 py-2 bg-gold text-white rounded-xl hover:bg-gold-dark"
                                >
                                    שמור שינויים
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
