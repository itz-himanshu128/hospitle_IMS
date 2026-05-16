import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Patient, InventoryItem, AttendanceRecord, Message, Role, Note } from '../types';
import AttendanceCalendar from '../components/AttendanceCalendar';
import NotesSection from '../components/NotesSection';
import { 
  Users, 
  Clock, 
  Plus, 
  Search, 
  AlertCircle,
  TrendingUp,
  RotateCcw,
  Edit,
  Trash2,
  X,
  MessageSquare,
  Send,
  CheckCheck,
  Calendar as CalendarIcon,
  UserX,
  ChevronLeft,
  MoreVertical,
  User as UserIcon,
  Activity,
  FileText,
  AlertTriangle,
  Lock,
  Briefcase,
  ChevronDown,
  Megaphone
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminDashboardProps {
  currentView: string;
  users: User[];
  patients: Patient[];
  inventory: InventoryItem[];
  attendance: AttendanceRecord[];
  messages: Message[];
  notes: Note[];
  user: User;
  onAddPatient: (p: Patient) => void;
  onUpdatePatient: (p: Patient) => void;
  onResetPassword: (id: string) => void;
  onAddUser: (u: User) => void;
  onUpdateUser: (u: User) => void;
  onDeleteUser?: (id: string) => void;
  onAddInventory: (item: InventoryItem) => void;
  onUpdateInventory: (item: InventoryItem) => void;
  onDeleteInventory: (id: string) => void;
  onSendMessage: (content: string, toUserId: string) => void;
  onBroadcastMessage: (content: string) => void;
  onMarkAsRead: (id: string) => void;
  onAddNote: (note: Omit<Note, 'id' | 'userId' | 'createdAt'>) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  currentView, users, patients, inventory, attendance, messages, notes, user,
  onAddPatient, onUpdatePatient, onResetPassword, onAddUser, onUpdateUser, onDeleteUser,
  onAddInventory, onUpdateInventory, onDeleteInventory,
  onSendMessage, onBroadcastMessage, onMarkAsRead, onAddNote, onUpdateNote, onDeleteNote
}) => {
  // Global Dashboard State
  const [searchTerm, setSearchTerm] = useState('');

  // --- Message Center State ---
  const [msgSelectedUserId, setMsgSelectedUserId] = useState<string | null>(null);
  const [msgReplyContent, setMsgReplyContent] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');

  // --- Patient Mgmt State ---
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    status: 'Waiting',
    appointmentTime: '09:00',
    appointmentDate: new Date().toISOString().split('T')[0]
  });

  // --- User Mgmt State ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [currentUserItem, setCurrentUserItem] = useState<Partial<User>>({});
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // --- Inventory State ---
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [currentInventoryItem, setCurrentInventoryItem] = useState<Partial<InventoryItem>>({});
  const [inventoryFormErrors, setInventoryFormErrors] = useState<string[]>([]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // --- Attendance State ---
  // Local Date String for Initialization
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(todayStr);

  // --- HELPERS & MEMOS ---

  // Scroll to bottom of chat when messages change or chat opens
  useEffect(() => {
    if (msgSelectedUserId && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, msgSelectedUserId]);

  // Group messages logic - FIXED to show ALL messages correctly
  const conversations = useMemo(() => {
    const map = new Map<string, Message[]>();
    
    messages.forEach(msg => {
        // Group messages by the OTHER person (not this admin)
        const otherId = msg.fromUserId === user.id ? msg.toUserId : msg.fromUserId;
        
        // Skip if otherId is still the admin (e.g. self-message or 'ADMIN' string)
        if (otherId === user.id || otherId === 'ADMIN') {
            // Try to find if this message was sent TO me but from a different ID
            if (msg.fromUserId !== user.id) {
                const senderId = msg.fromUserId;
                if (!map.has(senderId)) map.set(senderId, []);
                map.get(senderId)?.push(msg);
            }
            return;
        }

        if (!map.has(otherId)) {
            map.set(otherId, []);
        }
        map.get(otherId)?.push(msg);
    });

    return Array.from(map.entries()).map(([userId, msgs]) => {
        const otherUser = users.find(u => u.id === userId);
        const sortedMsgs = msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const lastMsg = sortedMsgs[sortedMsgs.length - 1];
        // Count unread messages sent TO me (the current admin)
        const unreadCount = sortedMsgs.filter(m => !m.read && (m.toUserId === user.id || m.toUserId === 'ADMIN') && m.fromUserId !== user.id).length;

        return {
            userId,
            user: otherUser,
            messages: sortedMsgs,
            lastMsg,
            unreadCount
        };
    }).sort((a, b) => new Date(b.lastMsg.timestamp).getTime() - new Date(a.lastMsg.timestamp).getTime());
  }, [messages, users, user.id]);

  // --- RENDER FUNCTIONS ---

  const renderMessageCenter = () => {
    const activeConversation = msgSelectedUserId ? conversations.find(c => c.userId === msgSelectedUserId) : null;
    const activeUser = msgSelectedUserId ? users.find(u => u.id === msgSelectedUserId) : null;

    const handleSend = () => {
      if (msgReplyContent.trim() && msgSelectedUserId) {
        onSendMessage(msgReplyContent, msgSelectedUserId);
        setMsgReplyContent('');
      }
    };

    const handleSendAnnouncement = () => {
        if(announcementText.trim()) {
            onBroadcastMessage(announcementText);
            setAnnouncementText('');
            setIsAnnouncementModalOpen(false);
            alert("Announcement sent to all staff.");
        }
    };

    const handleSelectConversation = (userId: string) => {
        setMsgSelectedUserId(userId);
        const conversation = conversations.find(c => c.userId === userId);
        if (conversation) {
            conversation.messages
                .filter(m => !m.read && (m.toUserId === 'ADMIN' || m.toUserId === user.id))
                .forEach(m => onMarkAsRead(m.id));
        }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-[calc(100vh-140px)] flex relative">
        
        {/* LEFT SIDEBAR: Contact List */}
        <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 flex-col bg-white ${msgSelectedUserId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 bg-[#f0f2f5] border-b border-gray-200 flex justify-between items-center h-16 shrink-0">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                      <UserIcon className="w-6 h-6" />
                   </div>
                   <h2 className="font-bold text-gray-800">Chats</h2>
                </div>
            </div>
            
            <div className="p-3 bg-white border-b border-gray-100">
                <button 
                    onClick={() => setIsAnnouncementModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition-colors border border-blue-100 text-sm"
                >
                    <Megaphone className="w-4 h-4" />
                    New Announcement
                </button>
            </div>

            <div className="overflow-y-auto flex-1 bg-white">
                {conversations.length === 0 && (
                    <div className="p-6 text-center text-gray-400 text-sm">
                        No active conversations.
                    </div>
                )}
                {conversations.map(conv => (
                    <div 
                        key={conv.userId}
                        onClick={() => handleSelectConversation(conv.userId)}
                        className={`flex items-center p-3 cursor-pointer transition-colors border-b border-gray-100 hover:bg-[#f5f6f6] ${msgSelectedUserId === conv.userId ? 'bg-[#f0f2f5]' : ''}`}
                    >
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg">
                                {(conv.user?.name || conv.lastMsg?.fromUserName || 'U').charAt(0)}
                            </div>
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className="font-medium text-gray-900 truncate">{conv.user?.name || conv.lastMsg?.fromUserName || 'Unknown User'}</h3>
                                <span className={`text-xs whitespace-nowrap ml-2 ${conv.unreadCount > 0 ? 'text-green-500 font-bold' : 'text-gray-400'}`}>
                                    {new Date(conv.lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-500 truncate pr-2 flex items-center">
                                    {conv.lastMsg.fromUserRole === 'ADMIN' && (
                                        <CheckCheck className="w-4 h-4 mr-1 text-blue-500" />
                                    )}
                                    {conv.lastMsg.content}
                                </p>
                                {conv.unreadCount > 0 && (
                                    <span className="min-w-[20px] h-5 flex items-center justify-center bg-green-500 text-white text-xs font-bold rounded-full px-1.5">
                                        {conv.unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* RIGHT SIDE: Chat Area */}
        <div className={`w-full md:w-2/3 lg:w-3/4 flex-col bg-[#efeae2] ${msgSelectedUserId ? 'flex' : 'hidden md:flex'}`}>
            {msgSelectedUserId && activeUser ? (
                <>
                    {/* Chat Header */}
                    <div className="h-16 px-4 py-2 bg-[#f0f2f5] border-b border-gray-200 flex items-center justify-between shadow-sm z-10 shrink-0">
                        <div className="flex items-center">
                            <button 
                                onClick={() => setMsgSelectedUserId(null)}
                                className="md:hidden mr-2 p-1 hover:bg-gray-200 rounded-full text-gray-600"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold mr-3">
                                {activeUser.name.charAt(0)}
                            </div>
                            <div className="flex flex-col justify-center">
                                <h3 className="font-semibold text-gray-800 text-sm leading-tight">{activeUser.name}</h3>
                                <span className="text-xs text-gray-500 leading-tight">Online</span>
                            </div>
                        </div>
                        <div className="flex gap-4 text-gray-600">
                             <Search className="w-5 h-5 cursor-pointer hover:text-gray-800" />
                             <MoreVertical className="w-5 h-5 cursor-pointer hover:text-gray-800" />
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div 
                        className="flex-1 overflow-y-auto p-4 space-y-2 sm:px-10" 
                        style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                    >
                        {activeConversation?.messages.map((msg) => {
                            const isMe = msg.fromUserRole === 'ADMIN';
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1`}>
                                    <div 
                                        className={`max-w-[85%] md:max-w-[65%] rounded-lg px-3 py-1.5 shadow-sm text-sm relative ${
                                            isMe 
                                            ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-none' 
                                            : 'bg-white text-gray-900 rounded-tl-none'
                                        }`}
                                    >
                                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        <div className="flex justify-end items-center gap-1 mt-0.5">
                                            <span className="text-[10px] text-gray-500 min-w-fit">
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                            </span>
                                            {isMe && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatBottomRef} />
                    </div>

                    {/* Input Area */}
                    <div className="bg-[#f0f2f5] px-4 py-3 border-t border-gray-200 shrink-0">
                        <div className="flex items-end gap-2">
                             <div className="flex-1 bg-white rounded-lg border border-gray-200 flex items-center px-4 py-2 focus-within:ring-1 focus-within:ring-white">
                                <textarea 
                                    value={msgReplyContent}
                                    onChange={(e) => setMsgReplyContent(e.target.value)}
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Type a message"
                                    className="flex-1 max-h-32 min-h-[24px] bg-transparent border-none outline-none text-gray-800 resize-none py-1"
                                    rows={1}
                                />
                            </div>
                            <button 
                                onClick={handleSend}
                                disabled={!msgReplyContent.trim()}
                                className={`p-3 rounded-full mb-0.5 transition-colors flex items-center justify-center ${msgReplyContent.trim() ? 'bg-[#00a884] text-white hover:bg-[#008f6f]' : 'bg-gray-200 text-gray-400'}`}
                            >
                                <Send className="w-5 h-5 ml-0.5" />
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-[#f0f2f5] border-b-[6px] border-[#25d366]">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                        <MessageSquare className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-light text-gray-600 mb-4">MediCore Web</h3>
                    <p className="max-w-md text-sm text-gray-500">Send and receive messages to hospital staff securely. Select a chat to start messaging.</p>
                </div>
            )}
        </div>

        {/* Announcement Modal */}
        {isAnnouncementModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                    <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Megaphone className="w-6 h-6" /> Make Announcement
                        </h3>
                        <button 
                            onClick={() => setIsAnnouncementModalOpen(false)}
                            className="text-blue-100 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-gray-500 mb-4">
                            This message will be broadcast to all doctors, nurses, and staff members immediately.
                        </p>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-gray-700"
                            placeholder="Type your announcement here..."
                            value={announcementText}
                            onChange={(e) => setAnnouncementText(e.target.value)}
                        />
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setIsAnnouncementModalOpen(false)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendAnnouncement}
                                disabled={!announcementText.trim()}
                                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                Broadcast
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  };

  const renderOverview = () => {
    // ... (No changes to Overview)
    const data = [
      { name: 'Patients', count: patients.length },
      { name: 'Doctors', count: users.filter(u => u.role === 'DOCTOR').length },
      { name: 'Nurses', count: users.filter(u => u.role === 'NURSE').length },
      { name: 'Staff', count: users.filter(u => u.role === 'STAFF').length },
    ];
    return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="p-4 rounded-full bg-blue-100 text-blue-600 mr-4">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Patients</p>
                <h3 className="text-3xl font-bold text-gray-800">{patients.length}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
               <div className="p-4 rounded-full bg-green-100 text-green-600 mr-4">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Appointments Today</p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {patients.filter(p => p.status === 'Waiting').length}
                </h3>
              </div>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
               <div className="p-4 rounded-full bg-purple-100 text-purple-600 mr-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Staff Present</p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {attendance.filter(a => a.date === todayStr && a.punchIn).length}
                </h3>
              </div>
            </div>
          </div>
  
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Hospital Statistics</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
  };

  const renderAttendanceMgmt = () => {
    // ... (No changes to Attendance)
    const recordsForDate = attendance.filter(a => a.date === selectedAttendanceDate);
    
    // Stats for the selected day
    const presentCount = recordsForDate.filter(a => a.punchIn).length;
    const overtimeCount = recordsForDate.filter(a => {
        const u = users.find(u => u.id === a.userId);
        return u && a.totalHours > u.dailyWorkHoursLimit;
    }).length;

    const renderCalendarCell = (date: string) => {
        const dayRecords = attendance.filter(a => a.date === date);
        const present = dayRecords.filter(a => a.punchIn).length;
        const issues = dayRecords.filter(a => {
            const u = users.find(u => u.id === a.userId);
            return u && a.totalHours > u.dailyWorkHoursLimit;
        }).length;

        if (present === 0) return null;

        return (
            <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center text-[10px] text-green-700 bg-green-50 px-1 rounded">
                    <CheckCheck className="w-3 h-3 mr-1" /> {present} Present
                </div>
                {issues > 0 && (
                    <div className="flex items-center text-[10px] text-red-700 bg-red-50 px-1 rounded">
                        <AlertCircle className="w-3 h-3 mr-1" /> {issues} OT
                    </div>
                )}
            </div>
        );
    };

    return (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Column */}
        <div className="lg:w-7/12">
            <AttendanceCalendar 
                selectedDate={selectedAttendanceDate}
                onDateSelect={setSelectedAttendanceDate}
                renderDateCell={renderCalendarCell}
            />
        </div>

        {/* Details Column */}
        <div className="lg:w-5/12 flex flex-col gap-6">
            {/* Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Summary for {new Date(selectedAttendanceDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric'})}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-xs text-green-600 font-semibold uppercase">Present</p>
                        <p className="text-2xl font-bold text-green-800">{presentCount}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                        <p className="text-xs text-orange-600 font-semibold uppercase">Overtime</p>
                        <p className="text-2xl font-bold text-orange-800">{overtimeCount}</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h4 className="font-semibold text-gray-700 text-sm">Staff Activity Log</h4>
                </div>
                <div className="overflow-y-auto max-h-[400px]">
                    {recordsForDate.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                            <UserX className="w-8 h-8 mb-2 opacity-50" />
                            <p>No records found for this date.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-gray-100">
                                {recordsForDate.map(record => {
                                    const user = users.find(u => u.id === record.userId);
                                    if (!user) return null;
                                    const isOvertime = record.totalHours > (user.dailyWorkHoursLimit || 8);
                                    
                                    return (
                                        <tr key={record.id} className="hover:bg-slate-50">
                                            <td className="p-3">
                                                <p className="font-medium text-gray-800 text-sm">{user.name}</p>
                                                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase">{user.role}</span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="text-xs text-gray-600">
                                                    {record.totalHours.toFixed(1)} hrs
                                                </div>
                                                {isOvertime && <span className="text-[10px] text-red-600 font-bold">Overtime</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
      </div>
    );
  };

  const renderPatientMgmt = () => {
    // ... (No changes to Patient Management)
    const filteredPatients = patients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.disease.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSavePatient = () => {
      if (newPatient.name && newPatient.age && newPatient.disease) {
        if (newPatient.id) {
          // Edit existing patient
          onUpdatePatient(newPatient as Patient);
        } else {
          // Add new patient
          onAddPatient({
            id: `p${Date.now()}`,
            name: newPatient.name,
            age: Number(newPatient.age),
            disease: newPatient.disease,
            appointmentTime: newPatient.appointmentTime || '09:00',
            appointmentDate: newPatient.appointmentDate || new Date().toISOString().split('T')[0],
            status: newPatient.status as any,
            lastCheckup: new Date().toISOString().split('T')[0],
            notes: newPatient.notes || '',
          });
        }
        setIsAddingPatient(false);
        setNewPatient({ status: 'Waiting', appointmentTime: '09:00', appointmentDate: new Date().toISOString().split('T')[0] });
      }
    };
    
    const handleEditPatient = (patient: Patient) => {
        setNewPatient(patient);
        setIsAddingPatient(true);
    };

    const handleAddNewClick = () => {
        setNewPatient({ status: 'Waiting', appointmentTime: '09:00', appointmentDate: new Date().toISOString().split('T')[0] });
        setIsAddingPatient(true);
    };

    if (isAddingPatient) {
      return (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
            <h3 className="text-2xl font-bold text-gray-800">
                {newPatient.id ? 'Edit Patient Details' : 'Register New Patient'}
            </h3>
            <button onClick={() => setIsAddingPatient(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Full Name</label>
                <div className="relative group">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                        placeholder="e.g. John Doe" 
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900" 
                        onChange={e => setNewPatient({...newPatient, name: e.target.value})}
                        value={newPatient.name || ''}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Age</label>
                <input 
                    placeholder="e.g. 35" 
                    type="number" 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900"
                    onChange={e => setNewPatient({...newPatient, age: Number(e.target.value)})}
                    value={newPatient.age || ''}
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Condition / Disease</label>
                <div className="relative group">
                    <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                        placeholder="e.g. Influenza" 
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900"
                        onChange={e => setNewPatient({...newPatient, disease: e.target.value})}
                        value={newPatient.disease || ''}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Appointment Date</label>
                <div className="relative group">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                    <input 
                        type="date" 
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 appearance-none"
                        onChange={e => setNewPatient({...newPatient, appointmentDate: e.target.value})}
                        value={newPatient.appointmentDate || ''}
                    />
                </div>
            </div>

             <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Appointment Time</label>
                <div className="relative group">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                    <input 
                        type="time" 
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 appearance-none"
                        onChange={e => setNewPatient({...newPatient, appointmentTime: e.target.value})}
                        value={newPatient.appointmentTime || ''}
                    />
                </div>
            </div>

             <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Status</label>
                <div className="relative">
                    <select 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer text-gray-900"
                        onChange={e => setNewPatient({...newPatient, status: e.target.value as any})}
                        value={newPatient.status}
                    >
                        <option value="Waiting">Waiting</option>
                        <option value="Admitted">Admitted</option>
                        <option value="Examined">Examined</option>
                         <option value="Discharged">Discharged</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-gray-700">Medical Notes</label>
                <div className="relative group">
                    <FileText className="absolute left-3 top-4 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <textarea 
                        placeholder="Add initial diagnosis notes, allergies, or other important information..." 
                        rows={4}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none text-gray-900"
                        onChange={e => setNewPatient({...newPatient, notes: e.target.value})}
                        value={newPatient.notes || ''}
                    />
                </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
                onClick={() => setIsAddingPatient(false)} 
                className="px-6 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={handleSavePatient} 
                className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 active:scale-[0.98]"
            >
                {newPatient.id ? 'Update Record' : 'Save Patient Record'}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search patients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
            />
          </div>
          <button 
            onClick={handleAddNewClick}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Patient
          </button>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map(patient => (
            <div key={patient.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg text-gray-800">{patient.name}</h4>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  patient.status === 'Waiting' ? 'bg-yellow-100 text-yellow-700' :
                  patient.status === 'Admitted' ? 'bg-red-100 text-red-700' :
                  patient.status === 'Discharged' ? 'bg-gray-100 text-gray-600' :
                  'bg-green-100 text-green-700'
                }`}>
                  {patient.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">{patient.disease} • {patient.age} yrs</p>
              
              <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-medium">{patient.appointmentDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span className="font-medium">{patient.appointmentTime}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 pt-1 border-t border-gray-200 mt-1">
                  <span>Last Checkup:</span>
                  <span>{patient.lastCheckup}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                <button 
                    onClick={() => handleEditPatient(patient)}
                    className="text-blue-600 text-sm font-medium hover:underline focus:outline-none"
                >
                    Edit Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderInventoryList = () => {
     // ... (No changes to Inventory)
    const handleSaveInventory = () => {
        const errors: string[] = [];
        if (!currentInventoryItem.name) errors.push('name');
        if (!currentInventoryItem.category) errors.push('category');
        if (currentInventoryItem.quantity === undefined) errors.push('quantity');
        if (currentInventoryItem.unit === undefined) errors.push('unit');
        if (currentInventoryItem.minThreshold === undefined) errors.push('minThreshold');

        if (errors.length > 0) {
            setInventoryFormErrors(errors);
            return;
        }

        if (currentInventoryItem.id) {
          onUpdateInventory(currentInventoryItem as InventoryItem);
        } else {
          const newItem: InventoryItem = {
             id: `i${Date.now()}`,
             name: currentInventoryItem.name!,
             category: currentInventoryItem.category as any,
             quantity: Number(currentInventoryItem.quantity),
             minThreshold: Number(currentInventoryItem.minThreshold),
             unit: currentInventoryItem.unit!
          };
          onAddInventory(newItem);
        }
        setIsInventoryModalOpen(false);
        setCurrentInventoryItem({});
        setInventoryFormErrors([]);
    };

    const handleEditInventory = (item: InventoryItem) => {
      setCurrentInventoryItem(item);
      setInventoryFormErrors([]);
      setIsInventoryModalOpen(true);
    };

    const handleAddInventoryClick = () => {
      setCurrentInventoryItem({ category: 'Medicine' }); // Default values
      setInventoryFormErrors([]);
      setIsInventoryModalOpen(true);
    };

    const handleDeleteInventoryClick = (id: string) => {
      setItemToDelete(id);
    };

    const confirmDelete = () => {
        if(itemToDelete) {
            onDeleteInventory(itemToDelete);
            setItemToDelete(null);
        }
    }

    const hasError = (field: string) => inventoryFormErrors.includes(field);

    return (
      <>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 flex justify-between items-center border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800">Inventory Records</h3>
            <button
              onClick={handleAddInventoryClick}
              className="flex items-center text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
              <tr>
                <th className="p-4">Item Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventory.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4 text-gray-600">{item.category}</td>
                  <td className="p-4">{item.quantity} {item.unit}</td>
                  <td className="p-4">
                    {item.quantity < item.minThreshold ? (
                      <span className="text-red-600 flex items-center text-sm font-bold">
                        <AlertCircle className="w-4 h-4 mr-1" /> Low Stock
                      </span>
                    ) : (
                      <span className="text-green-600 text-sm font-medium">In Stock</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleEditInventory(item)} 
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteInventoryClick(item.id)} 
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Delete Confirmation Modal */}
        {itemToDelete && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Item?</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Are you sure you want to remove this item from the inventory? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => setItemToDelete(null)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* JS Modal Overlay */}
        {isInventoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800">
                  {currentInventoryItem.id ? `Edit Item: ${currentInventoryItem.name}` : 'Add New Item'}
                </h3>
                <button 
                  onClick={() => setIsInventoryModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-gray-500 mb-1 uppercase">Item Name</label>
                  <input
                    placeholder="E.g. Paracetamol"
                    className={`p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-gray-900 placeholder-gray-400 ${hasError('name') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200'}`}
                    value={currentInventoryItem.name || ''}
                    onChange={e => setCurrentInventoryItem({...currentInventoryItem, name: e.target.value})}
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-gray-500 mb-1 uppercase">Category</label>
                  <select
                    className={`p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-gray-900 ${hasError('category') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200'}`}
                    value={currentInventoryItem.category || 'Medicine'}
                    onChange={e => setCurrentInventoryItem({...currentInventoryItem, category: e.target.value as any})}
                  >
                    <option value="Medicine">Medicine</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Consumable">Consumable</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-gray-500 mb-1 uppercase">Quantity</label>
                    <input
                      placeholder="0"
                      type="number"
                      className={`p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-gray-900 placeholder-gray-400 ${hasError('quantity') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200'}`}
                      value={currentInventoryItem.quantity ?? ''}
                      onChange={e => setCurrentInventoryItem({...currentInventoryItem, quantity: Number(e.target.value)})}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-gray-500 mb-1 uppercase">Unit</label>
                    <input
                      placeholder="E.g. boxes"
                      className={`p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-gray-900 placeholder-gray-400 ${hasError('unit') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200'}`}
                      value={currentInventoryItem.unit || ''}
                      onChange={e => setCurrentInventoryItem({...currentInventoryItem, unit: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-gray-500 mb-1 uppercase">Min Threshold</label>
                  <input
                    placeholder="Minimum quantity before alert"
                    type="number"
                    className={`p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-gray-900 placeholder-gray-400 ${hasError('minThreshold') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200'}`}
                    value={currentInventoryItem.minThreshold ?? ''}
                    onChange={e => setCurrentInventoryItem({...currentInventoryItem, minThreshold: Number(e.target.value)})}
                  />
                </div>

                {inventoryFormErrors.length > 0 && (
                    <div className="flex items-center text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span>Please fill in all required fields correctly.</span>
                    </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 flex justify-end gap-3">
                <button 
                  onClick={() => setIsInventoryModalOpen(false)} 
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveInventory} 
                  className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
                >
                  {currentInventoryItem.id ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderUserMgmt = () => {
    // ... (No changes to User Mgmt)
    const handleAddUserClick = () => {
        setCurrentUserItem({ role: 'STAFF', dailyWorkHoursLimit: 8 });
        setIsUserModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setCurrentUserItem(user);
        setIsUserModalOpen(true);
    };

    const handleSaveUser = () => {
        if (!currentUserItem.name || !currentUserItem.username || !currentUserItem.password) {
            alert("Please fill in all required fields.");
            return;
        }

        if (currentUserItem.id) {
            // Edit
            onUpdateUser(currentUserItem as User);
        } else {
            // Add new user - create locally for UI, admin can register via API
            const newUser: User = {
                id: `u${Date.now()}`,
                name: currentUserItem.name,
                username: currentUserItem.username,
                password: currentUserItem.password,
                role: currentUserItem.role as Role,
                dailyWorkHoursLimit: currentUserItem.dailyWorkHoursLimit || 8,
                department: currentUserItem.department
            };
            onAddUser(newUser);
        }
        setIsUserModalOpen(false);
        setCurrentUserItem({});
    };

    const handleDeleteUser = (userId: string) => {
        setUserToDelete(userId);
    };

    const confirmDeleteUser = () => {
        if (userToDelete && onDeleteUser) {
            onDeleteUser(userToDelete);
            setUserToDelete(null);
        }
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">User Management</h3>
                    <button
                        onClick={handleAddUserClick}
                        className="flex items-center text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg transition-colors font-medium shadow-sm border border-blue-200"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add User
                    </button>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                    <tr>
                        <th className="p-4">Name</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Username</th>
                        <th className="p-4">Password</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-medium text-gray-800">{u.name}</td>
                        <td className="p-4 text-sm text-gray-600">
                             <span className={`px-2 py-1 rounded text-xs font-bold ${
                                 u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                 u.role === 'DOCTOR' ? 'bg-blue-100 text-blue-700' :
                                 u.role === 'NURSE' ? 'bg-pink-100 text-pink-700' :
                                 'bg-gray-100 text-gray-700'
                             }`}>
                                 {u.role}
                             </span>
                        </td>
                        <td className="p-4 text-sm text-gray-500">{u.username}</td>
                        <td className="p-4">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200">
                                {u.password}
                            </code>
                        </td>
                        <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-3">
                                <button 
                                    onClick={() => handleEditUser(u)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                                >
                                    <Edit className="w-4 h-4 mr-1" /> Edit
                                </button>
                                <button 
                                    onClick={() => onResetPassword(u.id)}
                                    className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center"
                                    title="Quick Reset Password"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                                    title="Delete User"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Delete User Confirmation Modal */}
            {userToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete User?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Are you sure you want to remove this user from the system? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setUserToDelete(null)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDeleteUser}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Modal */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">
                                {currentUserItem.id ? 'Edit User Details' : 'Add New User'}
                            </h3>
                            <button 
                                onClick={() => setIsUserModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 col-span-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Full Name</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="e.g. Dr. John Doe"
                                            value={currentUserItem.name || ''}
                                            onChange={e => setCurrentUserItem({...currentUserItem, name: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Role</label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                            value={currentUserItem.role || 'STAFF'}
                                            onChange={e => setCurrentUserItem({...currentUserItem, role: e.target.value as Role})}
                                        >
                                            <option value="ADMIN">Admin</option>
                                            <option value="DOCTOR">Doctor</option>
                                            <option value="NURSE">Nurse</option>
                                            <option value="STAFF">Staff</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                             <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Daily Hours</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="number"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="8"
                                            value={currentUserItem.dailyWorkHoursLimit || ''}
                                            onChange={e => setCurrentUserItem({...currentUserItem, dailyWorkHoursLimit: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Username</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="username"
                                            value={currentUserItem.username || ''}
                                            onChange={e => setCurrentUserItem({...currentUserItem, username: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="********"
                                            value={currentUserItem.password || ''}
                                            onChange={e => setCurrentUserItem({...currentUserItem, password: e.target.value})}
                                        />
                                    </div>
                                </div>
                                
                                {currentUserItem.role === 'DOCTOR' && (
                                     <div className="space-y-1 col-span-2">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Department</label>
                                        <input
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="e.g. Cardiology"
                                            value={currentUserItem.department || ''}
                                            onChange={e => setCurrentUserItem({...currentUserItem, department: e.target.value})}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsUserModalOpen(false)} 
                                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveUser} 
                                className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
                            >
                                {currentUserItem.id ? 'Save Changes' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
  };

  return (
    <div>
      {currentView === 'overview' && renderOverview()}
      {currentView === 'messages' && renderMessageCenter()}
      {currentView === 'attendance' && renderAttendanceMgmt()}
      {currentView === 'patients' && renderPatientMgmt()}
      {currentView === 'inventory' && renderInventoryList()}
      {currentView === 'users' && renderUserMgmt()}
      {currentView === 'notes' && (
        <NotesSection 
            userId={user.id} 
            notes={notes} 
            onAddNote={onAddNote} 
            onUpdateNote={onUpdateNote}
            onDeleteNote={onDeleteNote} 
        />
      )}
    </div>
  );
};

export default AdminDashboard;