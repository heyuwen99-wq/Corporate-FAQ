/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Component } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText, 
  MessageSquare, 
  Library, 
  Plus, 
  Search, 
  MoreHorizontal, 
  ChevronRight, 
  ChevronLeft,
  Upload, 
  X, 
  Send, 
  Paperclip, 
  History,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Heart,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Link as LinkIcon,
  User,
  FileUp,
  Lock,
  ChevronUp,
  Trash2,
  AlertCircle,
  LogOut,
  Key,
  Database,
  BarChart3,
  FileSearch,
  MessageCircle,
  ShieldCheck,
  Settings2,
  Terminal,
  Filter,
  RefreshCw,
  Download,
  Eye,
  Edit2,
  Trash,
  Check,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { View, AdminSubView, KnowledgeBase, FileItem, Message, Role } from './types';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db } from './firebase';

// Error Handling Spec
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Mock Data (Keeping for fallback or initial state)
const MOCK_KBS: KnowledgeBase[] = [
  { id: 'KB001', name: '待整理库', description: '由用户上传的参考文件', fileCount: 12, indexCount: 45, createdAt: '2024-03-20 10:00:00' },
  { id: 'KB002', name: '规范知识库', description: '企业内部设计与技术规范文档', fileCount: 8, indexCount: 120, createdAt: '2024-03-19 14:30:00' },
  { id: 'KB003', name: '案例知识库', description: '过往优秀项目案例总结', fileCount: 25, indexCount: 340, createdAt: '2024-03-18 09:15:00' },
  { id: 'KB004', name: '技术文件知识库', description: '核心技术专利与研发文档', fileCount: 15, indexCount: 88, createdAt: '2024-03-17 16:45:00' },
];

const MOCK_FILES: FileItem[] = [
  { id: 'F001', name: '2024年度设计规范', format: 'PDF', createdAt: '2024-03-20 10:00:00', status: true },
  { id: 'F002', name: '智能座舱交互逻辑', format: 'DOCX', createdAt: '2024-03-19 14:30:00', status: false },
  { id: 'F003', name: '项目管理流程说明', format: 'MD', createdAt: '2024-03-18 09:15:00', status: true },
  { id: 'F004', name: '研发部技术周报_Q1', format: 'XLSX', createdAt: '2024-03-17 16:45:00', status: true },
];

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      let errorMessage = "出错了，请稍后再试。";
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError.error) {
          errorMessage = `系统错误: ${parsedError.error}`;
        }
      } catch (e) {
        errorMessage = error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB] p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <X size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">抱歉，系统出现问题</h2>
            <p className="text-slate-500 mb-8">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('role-selection');
  const [userRole, setUserRole] = useState<Role>(null);
  const [adminSubView, setAdminSubView] = useState<AdminSubView>('kb-list');
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  // Default to true so the UI doesn't block on Firebase auth callbacks.
  // (Auth state will still update once `onAuthStateChanged` fires.)
  const [isAuthReady, setIsAuthReady] = useState(true);
  const [isMockUser, setIsMockUser] = useState(false);
  const [isRetrievalTest, setIsRetrievalTest] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [editingKB, setEditingKB] = useState<KnowledgeBase | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [uploadingFile, setUploadingFile] = useState<{ name: string, format: string } | null>(null);
  const [mockKBs, setMockKBs] = useState<KnowledgeBase[]>(MOCK_KBS);
  const [mockFilesByKB, setMockFilesByKB] = useState<Record<string, FileItem[]>>({});
  const [chats, setChats] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const navigateToKBFiles = (kb: KnowledgeBase) => {
    setSelectedKB(kb);
    setAdminSubView('file-mgmt');
  };

  const backToKBList = () => {
    setSelectedKB(null);
    setAdminSubView('kb-list');
  };

  useEffect(() => {
    // Check for local session first
    const savedUser = localStorage.getItem('mock_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsMockUser(true);
      setUserRole(user.role);
      setCurrentView(user.role === 'admin' ? 'admin' : 'chat');
      setIsAuthReady(true);
      return;
    }

    // In some offline/captive-network environments `onAuthStateChanged` may not fire promptly.
    // Add a timeout fallback so the UI can render (role selection + mock login 123/123).
    let didFinish = false;
    let timeoutId: number | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      didFinish = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role as Role);
            setCurrentView(userData.role === 'admin' ? 'admin' : 'chat');
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
        setCurrentUser(user);
        setIsMockUser(false);
      } else {
        if (!localStorage.getItem('mock_user')) {
          setCurrentUser(null);
          setUserRole(null);
          setCurrentView('role-selection');
        }
      }
      setIsAuthReady(true);
    });

    timeoutId = window.setTimeout(() => {
      if (didFinish) return;
      console.warn('Auth init timeout, falling back to role-selection UI.');
      setCurrentUser(null);
      setUserRole(null);
      setIsMockUser(false);
      setCurrentView('role-selection');
      setIsAuthReady(true);
    }, 3000);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setChats([]);
      return;
    }

    // If mock user, use mock chats with varied dates for grouping
    if (isMockUser) {
      const now = new Date();
      const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
      const fiveDaysAgo = new Date(now); fiveDaysAgo.setDate(now.getDate() - 5);
      const tenDaysAgo = new Date(now); tenDaysAgo.setDate(now.getDate() - 10);

      const mockChats = [
        { id: 'mock-1', title: '今天的问题对话', lastMessageAt: now.toISOString(), createdAt: now.toISOString() },
        { id: 'mock-2', title: '昨天的问题对话', lastMessageAt: yesterday.toISOString(), createdAt: yesterday.toISOString() },
        { id: 'mock-3', title: '7天内的对话', lastMessageAt: fiveDaysAgo.toISOString(), createdAt: fiveDaysAgo.toISOString() },
        { id: 'mock-4', title: '更早的对话', lastMessageAt: tenDaysAgo.toISOString(), createdAt: tenDaysAgo.toISOString() },
      ];
      setChats(mockChats);
      if (mockChats.length > 0 && !currentChatId) {
        setCurrentChatId(mockChats[0].id);
      }
      return;
    }

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const q = query(
      collection(db, 'chats'),
      where('userId', '==', currentUser.uid),
      where('lastMessageAt', '>=', threeMonthsAgo.toISOString()),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatList);
      if (chatList.length > 0 && !currentChatId) {
        setCurrentChatId(chatList[0].id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Navigation handlers
  const handleRoleSelect = (role: Role) => {
    setUserRole(role);
    setCurrentView('login');
  };

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    setIsMockUser(true);
    setUserRole(user.role);
    setCurrentView(user.role === 'admin' ? 'admin' : 'chat');
    localStorage.setItem('mock_user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('mock_user');
      await signOut(auth);
      setCurrentUser(null);
      setUserRole(null);
      setIsMockUser(false);
      setCurrentView('role-selection');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleNewChat = async () => {
    if (!currentUser) return;

    const now = new Date().toISOString();
    const newChatData = {
      userId: currentUser.uid,
      title: '新对话',
      createdAt: now,
      lastMessageAt: now
    };

    if (isMockUser) {
      const newChat = {
        id: `mock-${Date.now()}`,
        ...newChatData
      };
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
      return;
    }

    try {
      const chatDoc = await addDoc(collection(db, 'chats'), newChatData);
      setCurrentChatId(chatDoc.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats');
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (currentView === 'role-selection') {
    return <RoleSelection onSelect={handleRoleSelect} />;
  }

  if (currentView === 'login') {
    return (
      <Auth 
        onLogin={handleLogin}
        role={userRole}
        onBack={() => setCurrentView('role-selection')}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7FB]">
      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        adminSubView={adminSubView}
        setAdminSubView={setAdminSubView}
        userRole={userRole}
        onLogout={handleLogout}
        chats={chats}
        currentChatId={currentChatId}
        onChatSelect={setCurrentChatId}
        onNewChat={handleNewChat}
        currentUser={currentUser}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMockUser={isMockUser}
        onShowHistory={() => setIsHistoryModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto relative custom-scrollbar">
        <AnimatePresence mode="wait">
          {currentView === 'admin' ? (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-full flex flex-col p-6"
            >
              {adminSubView === 'kb-list' && (
                <KnowledgeBaseList 
                  onSelectKB={navigateToKBFiles} 
                  onCreateClick={() => {
                    setEditingKB(null);
                    setIsCreateModalOpen(true);
                  }} 
                  onEditKB={(kb: KnowledgeBase) => {
                    setEditingKB(kb);
                    setIsCreateModalOpen(true);
                  }}
                  isMockUser={isMockUser}
                  mockKBs={mockKBs}
                  onRetrievalTest={() => {
                    setIsRetrievalTest(true);
                    setCurrentView('chat');
                  }}
                />
              )}
              {adminSubView === 'file-mgmt' && selectedKB && (
                <FileManagement 
                  kb={selectedKB} 
                  onBack={backToKBList} 
                  onUploadClick={() => setAdminSubView('upload')}
                  isMockUser={isMockUser}
                  mockKBs={mockKBs}
                  mockFiles={mockFilesByKB[selectedKB.id] ?? MOCK_FILES}
                  onMockFilesChange={(nextFiles: FileItem[]) => {
                    setMockFilesByKB(prev => ({ ...prev, [selectedKB.id]: nextFiles }));
                  }}
                  onMoveMockFile={(file: FileItem, targetKBId: string) => {
                    setMockFilesByKB(prev => {
                      const sourceFiles = (prev[selectedKB.id] ?? MOCK_FILES).filter(f => f.id !== file.id);
                      const targetFiles = prev[targetKBId] ?? MOCK_FILES;
                      return {
                        ...prev,
                        [selectedKB.id]: sourceFiles,
                        [targetKBId]: [...targetFiles, file],
                      };
                    });
                  }}
                  onPreviewFile={(file: FileItem) => {
                    setPreviewFile(file);
                    setAdminSubView('file-preview');
                  }}
                />
              )}
              {adminSubView === 'file-preview' && previewFile && (
                <FilePreviewView 
                  file={previewFile}
                  onBack={() => setAdminSubView('file-mgmt')}
                />
              )}
              {adminSubView === 'upload' && selectedKB && (
                <FileUploadView 
                  kbName={selectedKB.name}
                  onBack={() => setAdminSubView('file-mgmt')} 
                  onGoToKBList={backToKBList}
                  onNext={(file: any) => {
                    setUploadingFile(file);
                    setAdminSubView('preview');
                  }}
                />
              )}
              {adminSubView === 'preview' && selectedKB && (
                <PreviewView 
                  kbName={selectedKB.name}
                  onBack={() => setAdminSubView('upload')} 
                  onGoToKB={() => setAdminSubView('file-mgmt')}
                  onGoToKBList={backToKBList}
                  onSave={() => {
                    if (uploadingFile) {
                      const newFile: FileItem = {
                        id: `F${Date.now()}`,
                        name: uploadingFile.name,
                        format: uploadingFile.format,
                        createdAt: new Date().toLocaleString(),
                        status: true
                      };
                      setMockFilesByKB(prev => {
                        const currentFiles = prev[selectedKB.id] ?? MOCK_FILES;
                        return { ...prev, [selectedKB.id]: [...currentFiles, newFile] };
                      });
                    }
                    setAdminSubView('file-mgmt');
                  }}
                />
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="h-full"
            >
              <ChatInterface 
                onLogout={handleLogout} 
                currentChatId={currentChatId}
                setCurrentChatId={setCurrentChatId}
                onNewChat={handleNewChat}
                currentUser={currentUser}
                isMockUser={isMockUser}
                isRetrievalTest={isRetrievalTest}
                onExitRetrievalTest={() => {
                  setIsRetrievalTest(false);
                  setCurrentView('admin');
                }}
                setChats={setChats}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Modal */}
        <CreateKBModal 
          isOpen={isCreateModalOpen} 
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingKB(null);
          }} 
          currentUser={currentUser}
          isMockUser={isMockUser}
          editingKB={editingKB}
          onKBAdded={(kb) => {
            if (editingKB) {
              setMockKBs(prev => prev.map(item => item.id === kb.id ? kb : item));
            } else {
              setMockKBs(prev => [...prev, kb]);
            }
          }}
        />

        <HistoryModal 
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          chats={chats}
          onChatSelect={(chatId) => {
            setCurrentChatId(chatId);
            setIsHistoryModalOpen(false);
          }}
        />
      </main>
    </div>
  );
}

// --- Components ---

function Auth({ onLogin, role, onBack }: { onLogin: (user: any) => void, role: Role, onBack: () => void }) {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Hardcoded credentials check as per user request
    if (employeeId === '123' && password === '123') {
      // Direct login bypass
      onLogin({
        uid: 'mock_user_123',
        email: `${role}_123@internal.com`,
        employeeId: '123',
        role: role,
        displayName: role === 'admin' ? '管理员' : '研究员'
      });
      setLoading(false);
      return;
    }

    // Map other IDs to a dummy email for Firebase Auth (if enabled)
    const dummyEmail = `${role}_${employeeId}@internal.com`;
    const dummyPassword = `password_${employeeId}`; 

    try {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, dummyEmail, dummyPassword);
        // onAuthStateChanged will handle the rest
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, dummyPassword);
          const user = userCredential.user;
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            employeeId: employeeId,
            role: role,
            createdAt: new Date().toISOString()
          });
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('工号或密码错误（演示请使用 123/123）');
      } else {
        setError('系统错误，请稍后再试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB] p-6 relative">
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 p-3 bg-white rounded-full shadow-md text-slate-400 hover:text-blue-600 transition-all hover:scale-110 active:scale-95"
      >
        <ArrowLeft size={24} />
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-10"
      >
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl ${role === 'admin' ? 'bg-blue-600 shadow-blue-100' : 'bg-emerald-600 shadow-emerald-100'}`}>
            {role === 'admin' ? <Settings size={32} /> : <MessageSquare size={32} />}
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            {role === 'admin' ? '管理员登录' : '员工登录'}
          </h2>
          <p className="text-slate-500 mt-2">
            请输入您的工号和密码
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">工号</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                placeholder="请输入工号 (123)"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">密码</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                placeholder="请输入密码 (123)"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${role === 'admin' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}
          >
            {loading ? '登录中...' : '立即登录'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            提示：演示账号工号 123，密码 123
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function RoleSelection({ onSelect }: { onSelect: (role: Role) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB] p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full grid md:grid-cols-2 gap-8"
      >
        <div className="md:col-span-2 text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-blue-200">
            <Library size={32} />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">企业智能知识库系统</h1>
          <p className="text-slate-500 text-lg">请选择您的身份以进入系统</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('admin')}
          className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center group transition-all"
        >
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            <Settings size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">系统管理员</h2>
          <p className="text-slate-500 leading-relaxed w-full min-h-[3rem]">
            管理知识库与上传文件
            <br />
            配置系统参数并查看运行日志
          </p>
          <div className="mt-8 flex items-center gap-2 text-blue-600 font-bold">
            <span>进入后台</span>
            <ChevronRight size={20} />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('employee')}
          className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center group transition-all"
        >
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
            <MessageSquare size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">员工</h2>
          <p className="text-slate-500 leading-relaxed w-full min-h-[3rem]">
            使用 AI 助手进行知识检索
            <br />
            方案咨询与日常办公辅助
          </p>
          <div className="mt-8 flex items-center gap-2 text-emerald-600 font-bold">
            <span>开始对话</span>
            <ChevronRight size={20} />
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
}

function Sidebar({ currentView, setCurrentView, adminSubView, setAdminSubView, userRole, onLogout, chats, currentChatId, onChatSelect, onNewChat, currentUser, isCollapsed, setIsCollapsed, isMockUser, onShowHistory }: any) {
  const isAdmin = userRole === 'admin';
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-chat-menu="true"]')) {
        setActiveMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const adminMenuItems = [
    { id: 'data', label: '数据分析', icon: LayoutDashboard, disabled: true },
    { id: 'users', label: '用户管理', icon: Users, disabled: true },
    { id: 'config', label: '功能配置', icon: Settings, disabled: true },
    { id: 'logs', label: '日志管理', icon: FileText, disabled: true },
    { id: 'feedback', label: '反馈管理', icon: MessageSquare, disabled: true },
    { id: 'admin', label: '知识库管理', icon: Library, disabled: false },
  ];

  const handleRename = async (chatId: string) => {
    if (!editTitle.trim()) return;
    
    if (isMockUser) {
      // In mock mode, we can't easily update the chats array passed from props
      // but we can simulate success
      setEditingChatId(null);
      return;
    }

    try {
      await setDoc(doc(db, 'chats', chatId), { title: editTitle }, { merge: true });
      setEditingChatId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}`);
    }
  };

  const handleDelete = async (chatId: string) => {
    if (isMockUser) {
      setDeleteConfirmId(null);
      if (currentChatId === chatId) onNewChat();
      return;
    }

    try {
      await deleteDoc(doc(db, 'chats', chatId));
      setDeleteConfirmId(null);
      if (currentChatId === chatId) onNewChat();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `chats/${chatId}`);
    }
  };

  const UserMenu = () => (
    <div className={`absolute bottom-20 ${isCollapsed ? 'left-16' : 'left-6'} w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50`}>
      <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">修改密码</button>
      <button 
        onClick={onLogout}
        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
      >
        退出登录
      </button>
    </div>
  );

  if (currentView === 'chat') {
    return (
      <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-[#E9F1F8] flex flex-col shrink-0 z-20 rounded-r-[2.5rem] shadow-lg border-r border-white/20 relative transition-all duration-300`}>
        <AnimatePresence>
          {isUserMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUserMenuOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-24 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-slate-400 hover:text-blue-600 z-30 border border-slate-100"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`px-6 mb-6 mt-6 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button 
            onClick={onNewChat}
            className={`flex items-center justify-center gap-2 bg-[#F0F7FF] rounded-2xl text-blue-600 font-medium hover:bg-white transition-all shadow-sm border border-blue-100/50 ${isCollapsed ? 'w-10 h-10 p-0' : 'w-full py-3'}`}
          >
            <Plus size={18} />
            {!isCollapsed && <span>新建对话</span>}
          </button>
        </div>

        <div 
          onClick={() => window.location.reload()}
          className={`p-8 flex items-center cursor-pointer ${isCollapsed ? 'justify-center' : 'gap-3'}`}
        >
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white shrink-0">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-3 h-3 border border-white"></div>
              <div className="w-3 h-3 border border-white"></div>
              <div className="w-3 h-3 border border-white"></div>
              <div className="w-3 h-3 border border-white"></div>
            </div>
          </div>
          {!isCollapsed && (
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 truncate">
              研究中心AI +
            </h1>
          )}
        </div>

        {/* Removed History Clock Icon from here */}

        <div className="flex-1 overflow-y-auto px-6 space-y-6 custom-scrollbar">
          {!isCollapsed && (
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-sm font-medium">历史对话</span>
              <button 
                onClick={onShowHistory}
                className="p-1 hover:bg-white rounded-md transition-colors text-slate-400 hover:text-blue-600"
                title="查看所有历史"
              >
                <Clock size={16} />
              </button>
            </div>
          )}

          <div className="space-y-6">
            {(() => {
              const now = new Date();
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              const sevenDaysAgo = new Date(today);
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

              const groups = [
                { label: '今天', chats: [] as any[] },
                { label: '昨天', chats: [] as any[] },
                { label: '7天内', chats: [] as any[] },
                { label: '更早', chats: [] as any[] },
              ];

              chats.forEach((chat: any) => {
                const chatDate = new Date(chat.createdAt || chat.lastMessageAt);
                if (chatDate >= today) groups[0].chats.push(chat);
                else if (chatDate >= yesterday) groups[1].chats.push(chat);
                else if (chatDate >= sevenDaysAgo) groups[2].chats.push(chat);
                else groups[3].chats.push(chat);
              });

              return groups.filter(g => g.chats.length > 0).map(group => (
                <div key={group.label} className="space-y-2">
                  {!isCollapsed && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4">{group.label}</div>}
                  {group.chats.map((chat: any) => (
                    <div 
                      key={chat.id} 
                      className="group relative"
                    >
                      {editingChatId === chat.id ? (
                        <div className="flex items-center gap-2 px-2 py-2 bg-white rounded-xl shadow-sm border border-blue-200">
                          <input 
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(chat.id);
                              if (e.key === 'Escape') setEditingChatId(null);
                            }}
                            onBlur={() => handleRename(chat.id)}
                            className="flex-1 text-sm bg-transparent outline-none text-slate-700"
                          />
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => onChatSelect(chat.id)}
                            className={`flex items-center rounded-xl text-sm transition-all truncate ${isCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full px-4 py-3 pr-10'} ${
                              currentChatId === chat.id ? 'bg-white text-blue-600 font-bold shadow-sm' : 'text-slate-600 hover:bg-white/60'
                            }`}
                            title={isCollapsed ? chat.title : ''}
                          >
                            {isCollapsed ? <MessageCircle size={18} /> : chat.title}
                          </button>
                          {!isCollapsed && (
                            <div data-chat-menu="true" className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === chat.id ? null : chat.id);
                                }}
                                className={`p-1 hover:text-slate-600 transition-all ${
                                  activeMenuId === chat.id
                                    ? 'opacity-100 text-slate-600'
                                    : 'text-slate-400 opacity-0 group-hover:opacity-100'
                                }`}
                              >
                                <MoreHorizontal size={16} />
                              </button>
                              
                              {activeMenuId === chat.id && (
                                <div 
                                  className="absolute right-0 top-full mt-1 w-24 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-[100]"
                                >
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingChatId(chat.id);
                                      setEditTitle(chat.title);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Edit2 size={12} />
                                    <span>重命名</span>
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirmId(chat.id);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 size={12} />
                                    <span>删除</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4">确认删除对话？</h3>
              <p className="text-slate-500 mb-8 text-sm">删除后对话内容将无法恢复。</p>
              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="px-6 py-2 bg-red-500 text-white font-medium hover:bg-red-600 rounded-xl shadow-lg shadow-red-100 transition-all"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <div className={`p-6 mt-auto relative ${isCollapsed ? 'flex justify-center' : ''}`}>
          {isUserMenuOpen && <UserMenu />}
          <div 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`flex items-center bg-white/40 rounded-2xl border border-white/20 cursor-pointer hover:bg-white/60 transition-all ${isCollapsed ? 'w-12 h-12 justify-center p-0' : 'gap-4 p-3'}`}
          >
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md shrink-0">
              <User size={24} />
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{currentUser?.displayName || currentUser?.email?.split('@')[0] || '用户'}</p>
                </div>
                <ChevronUp size={18} className={`text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </>
            )}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white flex flex-col shrink-0 z-20 border-r border-slate-200 relative transition-all duration-300`}>
      <AnimatePresence>
        {isUserMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsUserMenuOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-slate-400 hover:text-blue-600 z-30 border border-slate-100"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`p-6 flex items-center border-b border-slate-100 cursor-pointer ${isCollapsed ? 'justify-center' : 'gap-3'}`} onClick={() => setCurrentView('admin')}>
        <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center text-white shrink-0">
          <LayoutDashboard size={20} />
        </div>
        {!isCollapsed && <h1 className="text-lg font-bold text-slate-800 truncate">后台管理系统</h1>}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        {adminMenuItems.map((item) => (
          <button
            key={item.id}
            disabled={item.disabled}
            onClick={() => {
              if (item.id === 'admin') {
                setCurrentView('admin');
                setAdminSubView('kb-list');
              }
            }}
            className={`w-full flex items-center transition-all border-l-4 ${isCollapsed ? 'justify-center py-4' : 'gap-3 px-6 py-4'} ${
              currentView === 'admin' && item.id === 'admin'
                ? 'bg-blue-50 text-blue-600 border-blue-600'
                : item.disabled ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 border-transparent hover:bg-slate-50'
            }`}
            title={isCollapsed ? item.label : ''}
          >
            <item.icon size={20} className="shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className={`p-6 border-t border-slate-100 relative ${isCollapsed ? 'flex justify-center' : ''}`}>
        {isUserMenuOpen && <UserMenu />}
        <div 
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className={`flex items-center cursor-pointer hover:bg-slate-50 rounded-lg transition-all ${isCollapsed ? 'w-10 h-10 justify-center p-0' : 'gap-3 p-2'}`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
            <User size={20} />
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{currentUser?.displayName || '管理员'}</p>
              </div>
              <ChevronUp size={18} className={`text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

function KnowledgeBaseList({ onSelectKB, onCreateClick, onEditKB, isMockUser, mockKBs, onRetrievalTest }: any) {
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchDesc, setSearchDesc] = useState('');
  const [searchId, setSearchId] = useState('');
  const [isOperationLogOpen, setIsOperationLogOpen] = useState(false);
  const [isRetrievalTestOpen, setIsRetrievalTestOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeBase | null>(null);
  const [selectedKBs, setSelectedKBs] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (isMockUser) {
      setKbs(mockKBs);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'knowledgeBases'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setKbs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as KnowledgeBase[]);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore access failed, falling back to mock data:", error);
      setKbs(MOCK_KBS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isMockUser, mockKBs]);

  const filteredKBs = kbs.filter(kb => {
    const matchName = kb.name.toLowerCase().includes(searchName.toLowerCase());
    const matchDesc = kb.description.toLowerCase().includes(searchDesc.toLowerCase());
    const matchId = kb.id.toLowerCase().includes(searchId.toLowerCase());
    return matchName && matchDesc && matchId;
  });

  const totalItems = filteredKBs.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedKBs = filteredKBs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelectAll = () => {
    if (selectedKBs.length === paginatedKBs.length && paginatedKBs.length > 0) {
      setSelectedKBs([]);
    } else {
      setSelectedKBs(paginatedKBs.map(kb => kb.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedKBs.includes(id)) {
      setSelectedKBs(selectedKBs.filter(item => item !== id));
    } else {
      setSelectedKBs([...selectedKBs, id]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedKBs.length === 0) return;
    setIsBulkDeleteConfirmOpen(true);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#F0F2F5]">
      <div className="bg-white rounded-lg shadow-sm p-8 flex flex-col relative">
        <div className="flex justify-end gap-4 mb-8">
            {selectedKBs.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="px-6 py-2 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 text-sm font-bold flex items-center gap-2"
              >
                <Trash2 size={16} />
                <span>批量删除 ({selectedKBs.length})</span>
              </button>
            )}
            <button 
              onClick={() => setIsOperationLogOpen(true)}
              className="px-6 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 text-sm"
            >
              操作记录
            </button>
            <button 
              onClick={onCreateClick}
              className="px-6 py-2 bg-[#D9001B] text-white rounded flex items-center gap-2 hover:bg-red-700 text-sm font-bold"
            >
              <span>创建</span>
            </button>
        </div>

        <div className="flex items-end gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm whitespace-nowrap">知识库名称</span>
              <input 
                type="text" 
                placeholder="请输入" 
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="border border-slate-300 rounded px-3 py-1.5 text-sm w-48 focus:ring-1 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm whitespace-nowrap">知识库描述</span>
              <input 
                type="text" 
                placeholder="请输入" 
                value={searchDesc}
                onChange={(e) => setSearchDesc(e.target.value)}
                className="border border-slate-300 rounded px-3 py-1.5 text-sm w-48 focus:ring-1 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm whitespace-nowrap">知识库ID</span>
              <input 
                type="text" 
                placeholder="请输入" 
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="border border-slate-300 rounded px-3 py-1.5 text-sm w-48 focus:ring-1 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button className="bg-[#1890FF] text-white px-6 py-1.5 rounded flex items-center gap-2 hover:bg-blue-600 text-sm">
              <Search size={16} />
              <span>查询</span>
            </button>
            <button 
              onClick={onRetrievalTest}
              className="bg-emerald-600 text-white px-6 py-1.5 rounded text-sm font-medium hover:bg-emerald-700"
            >
              检索测试
            </button>
          </div>
        </div>

        <div className="border border-slate-200 rounded overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-white border-b border-slate-200 text-slate-800 text-sm font-bold">
                  <th className="px-6 py-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300" 
                      checked={selectedKBs.length === paginatedKBs.length && paginatedKBs.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 text-center">知识库名称</th>
                  <th className="px-6 py-4 text-center">知识库描述</th>
                  <th className="px-6 py-4 text-center">文件数量</th>
                  <th className="px-6 py-4 text-center">文件被引次数</th>
                  <th className="px-6 py-4 text-center">知识库ID</th>
                  <th className="px-6 py-4 text-center">创建时间</th>
                  <th className="px-6 py-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedKBs.map((kb) => (
                  <tr key={kb.id} className="hover:bg-slate-50/50 text-sm text-slate-600">
                    <td className="px-6 py-6 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300" 
                        checked={selectedKBs.includes(kb.id)}
                        onChange={() => toggleSelect(kb.id)}
                      />
                    </td>
                    <td className="px-6 py-6 text-center">{kb.name}</td>
                    <td className="px-6 py-6 text-center max-w-xs truncate">{kb.description}</td>
                    <td className="px-6 py-6 text-center">{kb.fileCount || 0}</td>
                    <td className="px-6 py-6 text-center">{kb.indexCount || 0}</td>
                    <td className="px-6 py-6 text-center font-mono text-xs">{kb.id}</td>
                    <td className="px-6 py-6 text-center">{kb.createdAt}</td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex gap-4">
                          <button onClick={() => onSelectKB(kb)} className="text-[#1890FF] hover:underline">文件管理</button>
                          {kb.name !== '待整理库' && (
                            <button onClick={() => onEditKB(kb)} className="text-[#1890FF] hover:underline">编辑</button>
                          )}
                        </div>
                        {kb.name !== '待整理库' && (
                          <button 
                            onClick={() => setDeleteTarget(kb)}
                            className="text-red-500 font-bold hover:underline"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Empty rows to fill space as in image */}
                {[...Array(Math.max(0, 5 - filteredKBs.length))].map((_, i) => (
                  <tr key={`empty-${i}`} className="h-20">
                    <td colSpan={8}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-end gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <span>共</span>
              <span className="text-slate-800">{totalItems}</span>
              <span>条</span>
            </div>
            
            <div className="relative">
              <select 
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-slate-200 rounded px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value={10}>10条/页</option>
                <option value={20}>20条/页</option>
                <option value={50}>50条/页</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else {
                    if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                        currentPage === pageNum 
                          ? 'bg-[#1890FF] text-white font-bold' 
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span>前往</span>
              <input 
                type="text" 
                className="w-12 border border-slate-200 rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = Number((e.target as HTMLInputElement).value);
                    if (val >= 1 && val <= totalPages) {
                      setCurrentPage(val);
                    }
                  }
                }}
              />
              <span>页</span>
            </div>
          </div>
        </div>

        {/* Operation Log Drawer */}
        <AnimatePresence>
          {isOperationLogOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOperationLogOpen(false)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 p-8"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-bold text-slate-800">操作记录</h2>
                  <button onClick={() => setIsOperationLogOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border-l-2 border-blue-500 pl-4 py-1">
                      <p className="text-sm font-bold text-slate-800">管理员 在 10:00 创建了新库</p>
                      <p className="text-xs text-slate-400 mt-1">2024-03-20 10:00:00</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Retrieval Test Modal */}
        <AnimatePresence>
          {isRetrievalTestOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsRetrievalTestOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-white w-full max-w-2xl rounded shadow-2xl p-8"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800">检索测试</h2>
                  <button onClick={() => setIsRetrievalTestOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">测试问题</label>
                    <textarea 
                      placeholder="请输入您想测试的问题..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded text-sm h-32 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button className="bg-[#1890FF] text-white px-8 py-2 rounded font-medium hover:bg-blue-600">开始检索</button>
                  </div>
                  <div className="bg-slate-50 p-6 rounded border border-slate-200 min-h-[200px]">
                    <p className="text-sm text-slate-400 text-center mt-12">检索结果将在此展示</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDeleteTarget(null)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-white w-full max-w-md rounded shadow-2xl p-8 text-center"
              >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">确认删除知识库？</h2>
                <p className="text-slate-500 text-sm mb-8">
                  删除知识库 <span className="font-bold text-slate-800">"{deleteTarget.name}"</span> 需同步清空该库下所有文档的向量索引，此操作不可逆。
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 py-2 border border-slate-300 rounded text-slate-600 font-medium hover:bg-slate-50"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => {
                      if (isMockUser) {
                        setKbs(prev => prev.filter(kb => kb.id !== deleteTarget.id));
                      }
                      setDeleteTarget(null);
                    }}
                    className="flex-1 py-2 bg-red-500 text-white rounded font-medium hover:bg-red-600"
                  >
                    确认删除
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Bulk Delete Confirmation Modal */}
        <AnimatePresence>
          {isBulkDeleteConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-white w-full max-w-md rounded shadow-2xl p-8 text-center"
              >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">确认批量删除？</h2>
                <p className="text-slate-500 text-sm mb-8">
                  您已选中 <span className="font-bold text-slate-800">{selectedKBs.length}</span> 个知识库，删除后将无法恢复。
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsBulkDeleteConfirmOpen(false)}
                    className="flex-1 py-2 border border-slate-300 rounded text-slate-600 font-medium hover:bg-slate-50"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => {
                      if (isMockUser) {
                        setKbs(prev => prev.filter(kb => !selectedKBs.includes(kb.id)));
                        setSelectedKBs([]);
                      }
                      setIsBulkDeleteConfirmOpen(false);
                    }}
                    className="flex-1 py-2 bg-red-500 text-white rounded font-medium hover:bg-red-600"
                  >
                    确认批量删除
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FileManagement({ kb, onBack, onUploadClick, isMockUser, mockKBs, mockFiles, onMockFilesChange, onMoveMockFile, onPreviewFile }: any) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<FileItem | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<FileItem | null>(null);
  const [newName, setNewName] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);

  useEffect(() => {
    if (isMockUser) {
      setFiles(mockFiles);
      setLoading(false);
      return;
    }

    const q = query(collection(db, `knowledgeBases/${kb.id}/files`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FileItem[]);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore access failed, falling back to mock data:", error);
      setFiles(MOCK_FILES);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [kb.id, isMockUser, mockFiles]);

  const updateMockFiles = (updater: (prev: FileItem[]) => FileItem[]) => {
    if (!isMockUser) return;
    setFiles(prev => {
      const next = updater(prev);
      onMockFilesChange?.(next);
      return next;
    });
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchName.toLowerCase()));
  const totalItems = filteredFiles.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedFiles = filteredFiles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelect = (id: string) => {
    setSelectedFiles(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedFiles.length === paginatedFiles.length && paginatedFiles.length > 0) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(paginatedFiles.map(f => f.id));
    }
  };

  const toggleStatus = (file: FileItem) => {
    if (isMockUser) {
      updateMockFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: !f.status } : f));
      return;
    }
    setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: !f.status } : f));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#F0F2F5]">
      <div className="bg-white rounded-lg shadow-sm p-8 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
              title="返回"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <button onClick={onBack} className="text-slate-400 hover:text-blue-600">知识库管理</button>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="text-slate-800 font-bold">{kb.name}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={onBack}
              className="px-6 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 text-sm flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              <span>返回上一步</span>
            </button>
            <button 
              onClick={() => selectedFiles.length > 0 && setIsBulkDeleteConfirmOpen(true)}
              className={`px-6 py-2 border border-slate-300 rounded text-sm transition-colors ${selectedFiles.length > 0 ? 'text-red-500 border-red-200 hover:bg-red-50' : 'text-slate-400 cursor-not-allowed'}`}
            >
              删除
            </button>
            <button 
              onClick={onUploadClick}
              className="px-6 py-2 bg-[#1890FF] text-white rounded flex items-center gap-2 hover:bg-blue-600 text-sm font-bold shadow-lg shadow-blue-100"
            >
              <span>上传文件</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Search size={16} />
            </div>
            <input 
              type="text" 
              placeholder="Search" 
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-100 border-transparent border focus:border-blue-500 focus:bg-white rounded-lg text-sm w-64 outline-none transition-all" 
            />
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-800 text-sm font-bold">
                  <th className="px-6 py-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300" 
                      checked={selectedFiles.length === paginatedFiles.length && paginatedFiles.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4">文件名称</th>
                  <th className="px-6 py-4 text-center">文件格式</th>
                  <th className="px-6 py-4 text-center">创建时间</th>
                  <th className="px-6 py-4 text-center">操作</th>
                  <th className="px-6 py-4 text-center">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/50 text-sm text-slate-600 transition-colors">
                    <td className="px-6 py-6 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300" 
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => toggleSelect(file.id)}
                      />
                    </td>
                    <td className="px-6 py-6">
                      <button 
                        onClick={() => {
                          setFileToRename(file);
                          setNewName(file.name);
                          setIsRenameModalOpen(true);
                        }}
                        className="font-medium text-slate-800 hover:text-blue-600 hover:underline transition-colors"
                      >
                        {file.name}
                      </button>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs font-mono">
                        {file.format}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center">{file.createdAt}</td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex items-center justify-center gap-4">
                        <button 
                          onClick={() => onPreviewFile(file)}
                          className="text-blue-500 hover:underline font-medium"
                        >
                          预览
                        </button>
                        <button 
                          onClick={() => {
                            setMoveTarget(file);
                            setIsMoveModalOpen(true);
                          }}
                          className="text-blue-500 hover:underline font-medium"
                        >
                          移动
                        </button>
                        <button 
                          onClick={() => {
                            setFileToDelete(file);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="text-red-500 hover:underline font-medium"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex justify-center">
                        <div 
                          onClick={() => toggleStatus(file)}
                          className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${file.status ? 'bg-[#52C41A]' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${file.status ? 'left-7' : 'left-1'}`} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Empty rows */}
                {[...Array(Math.max(0, 5 - paginatedFiles.length))].map((_, i) => (
                  <tr key={`empty-${i}`} className="h-20">
                    <td colSpan={6}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-end gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <span>共</span>
              <span className="text-slate-800">{totalItems}</span>
              <span>条</span>
            </div>
            
            <div className="relative">
              <select 
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-slate-200 rounded px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value={10}>10条/页</option>
                <option value={20}>20条/页</option>
                <option value={50}>50条/页</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else {
                    if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                        currentPage === pageNum 
                          ? 'bg-[#1890FF] text-white font-bold' 
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span>前往</span>
              <input 
                type="text" 
                className="w-12 border border-slate-200 rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = Number((e.target as HTMLInputElement).value);
                    if (val >= 1 && val <= totalPages) {
                      setCurrentPage(val);
                    }
                  }
                }}
              />
              <span>页</span>
            </div>
          </div>
        </div>
      </div>

      {/* Move File Modal */}
      <MoveFileModal 
        isOpen={isMoveModalOpen}
        onClose={() => {
          setIsMoveModalOpen(false);
          setMoveTarget(null);
        }}
        onMove={(targetKB: any) => {
          if (moveTarget) {
            if (isMockUser) {
              updateMockFiles(prev => prev.filter(f => f.id !== moveTarget.id));
              onMoveMockFile?.(moveTarget, targetKB.id);
            } else {
              setFiles(prev => prev.filter(f => f.id !== moveTarget.id));
            }
            alert(`已将文件 "${moveTarget.name}" 移动至 ${targetKB.name}`);
          }
          setIsMoveModalOpen(false);
          setMoveTarget(null);
        }}
        kbs={mockKBs}
        currentKBId={kb.id}
      />

      {/* Bulk Delete Confirmation Modal */}
      <AnimatePresence>
        {isBulkDeleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkDeleteConfirmOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-md rounded shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">确认批量删除文件？</h2>
              <p className="text-slate-500 text-sm mb-8">
                您已选中 <span className="font-bold text-slate-800">{selectedFiles.length}</span> 个文件，删除后将物理移除文件并同步删除向量索引，此操作不可逆。
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsBulkDeleteConfirmOpen(false)}
                  className="flex-1 py-2 border border-slate-300 rounded text-slate-600 font-medium hover:bg-slate-50"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    if (isMockUser) {
                      updateMockFiles(prev => prev.filter(f => !selectedFiles.includes(f.id)));
                      setSelectedFiles([]);
                    }
                    setIsBulkDeleteConfirmOpen(false);
                  }}
                  className="flex-1 py-2 bg-red-500 text-white rounded font-medium hover:bg-red-600"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rename Modal */}
      <AnimatePresence>
        {isRenameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRenameModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-8"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-6">修改文件名称</h3>
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-2">文件名称</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="请输入新的文件名称"
                />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsRenameModalOpen(false)}
                  className="flex-1 py-3 text-slate-500 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    if (fileToRename && newName.trim()) {
                      if (isMockUser) {
                        updateMockFiles(prev => prev.map(f => f.id === fileToRename.id ? { ...f, name: newName.trim() } : f));
                      } else {
                        setFiles(prev => prev.map(f => f.id === fileToRename.id ? { ...f, name: newName.trim() } : f));
                      }
                      setIsRenameModalOpen(false);
                    }
                  }}
                  className="flex-1 py-3 bg-[#1890FF] text-white rounded-xl font-bold hover:bg-blue-600 shadow-lg shadow-blue-100 transition-all"
                >
                  确认
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Individual Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">确认删除文件？</h3>
              <p className="text-slate-500 mb-8">删除后文件将无法找回，请谨慎操作。</p>
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="flex-1 py-3 text-slate-500 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    if (fileToDelete) {
                      if (isMockUser) {
                        updateMockFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
                      } else {
                        setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
                      }
                      setIsDeleteConfirmOpen(false);
                    }
                  }}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-100 transition-all"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MoveFileModal({ isOpen, onClose, onMove, kbs, currentKBId }: any) {
  const [selectedKB, setSelectedKB] = useState<any>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white w-full max-w-sm rounded-xl shadow-2xl p-6"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4">移动文件至...</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar mb-6">
              {kbs.filter((kb: any) => kb.id !== currentKBId).map((kb: any) => (
                <button 
                  key={kb.id}
                  onClick={() => setSelectedKB(kb)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all border ${
                    selectedKB?.id === kb.id 
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' 
                      : 'hover:bg-slate-50 text-slate-700 border-slate-100'
                  }`}
                >
                  {kb.name}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button 
                disabled={!selectedKB}
                onClick={() => {
                  if (selectedKB) {
                    onMove(selectedKB);
                    setSelectedKB(null);
                  }
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  selectedKB 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                确认移动
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function FileUploadView({ onBack, onNext, kbName, onGoToKBList }: any) {
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState('2024年度设计规范');
  const [fileFormat, setFileFormat] = useState('PDF');

  const handleNext = () => {
    setIsParsing(true);
    setTimeout(() => {
      setIsParsing(false);
      onNext({ name: fileName, format: fileFormat });
    }, 2000); // Simulate 2 seconds of parsing
  };

  if (isParsing) {
    return (
      <div className="flex flex-col h-full bg-[#F0F2F5] p-6">
        <div className="bg-white rounded-lg shadow-sm p-12 flex-1 flex flex-col items-center justify-center">
          <div className="w-24 h-24 relative mb-8">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">正在解析文件...</h2>
          <p className="text-slate-500">正在提取文本内容并进行向量化处理，请稍候</p>
          <div className="mt-12 w-full max-w-md bg-slate-100 h-2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="h-full bg-blue-600"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F0F2F5] p-6">
      <div className="bg-white rounded-lg shadow-sm p-12 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={onGoToKBList} className="text-slate-400 hover:text-blue-600 transition-colors">知识库管理</button>
            <span className="text-slate-400">/</span>
            <button onClick={onBack} className="text-slate-400 hover:text-blue-600 transition-colors">{kbName}</button>
            <span className="text-slate-400">/</span>
            <span className="text-slate-800 font-bold">上传文件</span>
          </div>
          <button 
            onClick={onBack}
            className="px-6 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 text-sm flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            <span>返回上一步</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-4xl border-2 border-dashed border-slate-300 rounded-2xl p-24 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer mb-12">
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
              <Plus size={40} />
            </div>
            <p className="text-xl font-bold text-slate-800 mb-4">拖拽文件至此，或者选择文件</p>
            <p className="text-sm text-slate-400 text-center max-w-md leading-relaxed">
              已支持 TXT、MARKDOWN、MDX、PDF、HTML、XLSX、XLS、DOC、DOCX、CSV、EML、MSG、PPTX、XML、EPUB、PPT、MD、HTM, 每个文件不超过15MB。
            </p>
          </div>
          
          <div className="w-full max-w-4xl mb-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-2">文档名称</label>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                  placeholder="请输入文档名称"
                />
              </div>
            </div>
          </div>

          <div className="w-full max-w-4xl flex items-center justify-center bg-slate-50 p-8 rounded-2xl border border-slate-200">
            <button 
              onClick={handleNext}
              className="bg-[#1890FF] text-white px-10 py-2 rounded-lg font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 whitespace-nowrap"
            >
              下一步
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilePreviewView({ file, onBack }: { file: FileItem, onBack: () => void }) {
  return (
    <div className="flex flex-col h-full bg-[#F0F2F5] p-6">
      <div className="bg-white rounded-lg shadow-sm p-8 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-slate-800">{file.name}</h2>
              <p className="text-xs text-slate-400">创建时间: {file.createdAt}</p>
            </div>
          </div>
          <button 
            onClick={onBack}
            className="px-6 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 text-sm flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            <span>返回上一步</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 rounded-xl p-8 border border-slate-100">
          <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-12 min-h-full">
            <h1 className="text-3xl font-bold text-slate-900 mb-8 text-center">{file.name}</h1>
            <div className="space-y-6 text-slate-700 leading-relaxed">
              <p>这是文件 "{file.name}" 的预览内容。在实际应用中，这里将展示从文件系统中提取的真实文本内容。</p>
              <p>知识库系统已成功解析该文档，并将其划分为多个语义分段，以便于大模型进行精确检索。</p>
              <div className="h-px bg-slate-100 my-8" />
              <p className="font-bold text-slate-800">文档摘要：</p>
              <p>本文档主要包含关于该主题的核心知识点和规范说明。通过向量化处理，系统可以根据用户的提问，快速定位到本文档中的相关章节，并结合上下文给出准确的回答。</p>
              <p>您可以检查此处的文本是否解析正确。如果发现解析错误或格式混乱，可以尝试更换解析策略重新上传。</p>
              {[1, 2, 3, 4, 5].map(i => (
                <p key={i}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewView({ onBack, onSave, kbName, onGoToKB, onGoToKBList }: any) {
  const [tags, setTags] = useState(['项目类型', '年份', '地区']);
  const [tagInput, setTagInput] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [chunks, setChunks] = useState(
    Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      content: `企业内部设计规范旨在统一产品的视觉语言与交互逻辑。通过标准化的组件库与设计原则，我们能够显著提升研发效率并保证用户体验的一致性。本章节重点讨论了智能座舱环境下的深色模式适配策略，包括色彩对比度要求、发光效果处理以及在不同光照条件下的可读性优化。`,
      tokens: 156 + i * 2
    }))
  );
  const [editingChunk, setEditingChunk] = useState<any>(null);
  const [isDeleteChunkConfirmOpen, setIsDeleteChunkConfirmOpen] = useState(false);
  const [chunkToDelete, setChunkToDelete] = useState<any>(null);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleSave = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onSave();
    }, 1500);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const deleteChunk = (id: number) => {
    setChunks(chunks.filter(c => c.id !== id));
  };

  const updateChunk = () => {
    if (editingChunk) {
      setChunks(chunks.map(c => c.id === editingChunk.id ? editingChunk : c));
      setEditingChunk(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F0F2F5] p-6 relative">
      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg"
          >
            <div className="bg-white p-12 rounded-3xl shadow-2xl flex flex-col items-center border border-slate-100">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                <Check size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">上传成功</h2>
              <p className="text-slate-500">文件已成功添加到知识库</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-lg shadow-sm p-8 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={onGoToKBList} className="text-slate-400 hover:text-blue-600 transition-colors">知识库管理</button>
            <span className="text-slate-400">/</span>
            <button onClick={onGoToKB} className="text-slate-400 hover:text-blue-600 transition-colors">{kbName}</button>
            <span className="text-slate-400">/</span>
            <button onClick={onBack} className="text-slate-400 hover:text-blue-600 transition-colors">上传文件</button>
            <span className="text-slate-400">/</span>
            <span className="text-slate-800 font-bold">文本处理</span>
          </div>
          <button 
            onClick={onBack}
            className="px-6 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 text-sm flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            <span>返回上一步</span>
          </button>
        </div>

        <div className="flex flex-col gap-10">
          {/* Content Preview */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">文本分段预览</h3>
              <span className="text-sm text-slate-400">共 {chunks.length} 个片段</span>
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 relative max-h-[500px] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                {chunks.map((chunk) => (
                  <div 
                    key={chunk.id} 
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 group hover:border-blue-300 transition-all relative cursor-pointer"
                    onClick={() => setEditingChunk(chunk)}
                  >
                    <div className="absolute right-4 top-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setChunkToDelete(chunk);
                          setIsDeleteChunkConfirmOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button 
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="点击修改"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed pr-24">
                      <span className="font-bold text-blue-600 mr-2">[片段 {chunk.id}]</span>
                      {chunk.content}
                    </p>
                    <div className="mt-4 flex justify-end">
                      <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">({chunk.tokens} tokens)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom: Tags and Actions */}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-4">文本标签</h3>
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 flex flex-col relative">
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag, idx) => (
                  <div key={idx} className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2 text-xs text-slate-600 shadow-sm">
                    <span>{tag}</span>
                    <X size={12} className="cursor-pointer hover:text-red-500 transition-colors" onClick={() => removeTag(tag)} />
                  </div>
                ))}
              </div>
              
              <div className="flex items-end justify-between gap-8">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    placeholder="输入标签并按回车添加" 
                    className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
                  />
                  <button 
                    onClick={addTag}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600 p-1 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <button 
                  onClick={handleSave}
                  className="bg-[#1890FF] text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
                >
                  保存并完成
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Chunk Confirmation Modal */}
      <AnimatePresence>
        {isDeleteChunkConfirmOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteChunkConfirmOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">确认删除此片段？</h3>
              <p className="text-slate-500 mb-8">删除后该片段将从预览中移除，此操作不可撤销。</p>
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setIsDeleteChunkConfirmOpen(false)}
                  className="flex-1 py-3 text-slate-500 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    if (chunkToDelete) {
                      deleteChunk(chunkToDelete.id);
                      setIsDeleteChunkConfirmOpen(false);
                      setChunkToDelete(null);
                    }
                  }}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-100 transition-all"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Chunk Modal */}
      <AnimatePresence>
        {editingChunk && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingChunk(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">修改片段 {editingChunk.id}</h3>
                  <button onClick={() => setEditingChunk(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>
                <textarea 
                  value={editingChunk.content}
                  onChange={(e) => setEditingChunk({ ...editingChunk, content: e.target.value })}
                  className="w-full h-64 p-6 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
                <div className="mt-8 flex justify-end gap-4">
                  <button 
                    onClick={() => setEditingChunk(null)}
                    className="px-8 py-2.5 border border-slate-300 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-all"
                  >
                    取消
                  </button>
                  <button 
                    onClick={updateChunk}
                    className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                  >
                    确认修改
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChatInterface({ onLogout, currentChatId, setCurrentChatId, onNewChat, currentUser, isMockUser, isRetrievalTest, onExitRetrievalTest, setChats }: { onLogout: () => void, currentChatId: string | null, setCurrentChatId: (id: string | null) => void, onNewChat: () => void, currentUser: any, isMockUser: boolean, isRetrievalTest?: boolean, onExitRetrievalTest?: () => void, setChats?: React.Dispatch<React.SetStateAction<any[]>> }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [mockMessagesByChat, setMockMessagesByChat] = useState<Record<string, Message[]>>({});
  const [inputValue, setInputValue] = useState('');
  const [isReferenceOpen, setIsReferenceOpen] = useState(true);
  const [referenceWidth, setReferenceWidth] = useState(180);
  const [isResizingReference, setIsResizingReference] = useState(false);
  const [selectedKBs, setSelectedKBs] = useState<string[]>(['规范知识库']);
  const [dislikeModal, setDislikeModal] = useState<{ isOpen: boolean, messageId: string | null }>({ isOpen: false, messageId: null });
  const [selectedReference, setSelectedReference] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const REFERENCE_MIN_WIDTH = 160;
  const REFERENCE_MAX_WIDTH = 340;

  useEffect(() => {
    if (!currentChatId) {
      setMessages([]);
      return;
    }

    if (isMockUser) {
      setMessages(mockMessagesByChat[currentChatId] ?? []);
      return;
    }

    const q = query(
      collection(db, 'chats', currentChatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[]);
    }, (error) => {
      console.warn("Firestore access failed for messages:", error);
    });

    return () => unsubscribe();
  }, [currentChatId, isMockUser, mockMessagesByChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isResizingReference) return;

    const onMouseMove = (e: MouseEvent) => {
      const rightGap = 16; // matches `right-4`
      const nextWidth = window.innerWidth - e.clientX - rightGap;
      const clamped = Math.max(REFERENCE_MIN_WIDTH, Math.min(REFERENCE_MAX_WIDTH, nextWidth));
      setReferenceWidth(clamped);
    };

    const onMouseUp = () => setIsResizingReference(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizingReference]);

  const handleSend = async (overrideValue?: string) => {
    const valueToSend = overrideValue || inputValue;
    if (!valueToSend.trim() || !currentUser) return;
    
    let chatId = currentChatId;

    if (isMockUser) {
      let activeChatId = currentChatId;
      if (!activeChatId) {
        const newChat = {
          id: `mock-${Date.now()}`,
          userId: currentUser.uid,
          title: valueToSend.slice(0, 15),
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString()
        };
        if (setChats) setChats(prev => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
        activeChatId = newChat.id;
      }
      const targetChatId = activeChatId!;

      const userMsg: Message = { 
        id: Date.now().toString(),
        role: 'user', 
        content: valueToSend, 
        timestamp: new Date().toISOString() 
      };
      setMockMessagesByChat(prev => {
        const nextMessages = [...(prev[targetChatId] ?? []), userMsg];
        setMessages(nextMessages);
        return { ...prev, [targetChatId]: nextMessages };
      });
      if (!overrideValue) setInputValue('');

      setTimeout(() => {
        const trimmed = valueToSend.trim();
        const isProblemCase = trimmed.includes('问题案例') || trimmed === '1';
        
        const aiMsg: Message = isProblemCase ? { 
          id: (Date.now() + 1).toString(),
          role: 'assistant', 
          content: '以下是为您生成的内容：xxxxx',
          timestamp: new Date().toISOString(),
          references: ['引用溯源链接', '引用溯源链接', '引用溯源链接']
        } : {
          id: (Date.now() + 1).toString(),
          role: 'assistant', 
          content: '很抱歉,提供的文档中没有包含关XXXXX具体内容。因此,我无法直接为您提供相关信息。\n如果您需要了解XXXXX的规范知识、相关的案例知识或技术文件等,建议您咨询专业的工程师或者查阅相关的技术文献和标准数据库以获取详细信息。\n\n同时,您可以参考一些通用设计规范,如《xxxxxxxx》等。', 
          timestamp: new Date().toISOString(),
          references: ['建议链接', '建议链接', '建议链接']
        };
        setMockMessagesByChat(prev => {
          const nextMessages = [...(prev[targetChatId] ?? []), aiMsg];
          setMessages(nextMessages);
          return { ...prev, [targetChatId]: nextMessages };
        });
      }, 1000);
      return;
    }

    if (!chatId) {
      // Create new chat
      try {
        const chatDoc = await addDoc(collection(db, 'chats'), {
          userId: currentUser.uid,
          title: valueToSend.slice(0, 15),
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString()
        });
        chatId = chatDoc.id;
        setCurrentChatId(chatId);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'chats');
        return;
      }
    }

    if (chatId && messages.length === 0) {
      const newTitle = valueToSend.slice(0, 15);
      if (isMockUser && setChats) {
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
      } else if (!isMockUser) {
        try {
          await setDoc(doc(db, 'chats', chatId), { title: newTitle }, { merge: true });
        } catch (error) {
          console.error("Error updating chat title:", error);
        }
      }
    }

    const userMsg = { 
      role: 'user', 
      content: valueToSend, 
      timestamp: new Date().toISOString() 
    };

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), userMsg);
      await setDoc(doc(db, 'chats', chatId), { lastMessageAt: new Date().toISOString() }, { merge: true });
      if (!overrideValue) setInputValue('');

      // Simulate AI response
      setTimeout(async () => {
        let aiContent = '很抱歉，提供的文档中没有包含关于XXXXX具体内容。因此，我无法直接为您提供相关信息。\n如果您需要了解XXXXX的规范知识、相关的案例知识或技术文件等，建议您咨询专业的工程师或者查阅相关的技术文献和标准数据库以获取详细信息。\n\n同时，您可以参考一些通用设计规范，如《xxxxxxxx》等。';
        let aiRefs = ['建议链接', '建议链接', '建议链接'];

        if (valueToSend.includes('检索失败')) {
          aiContent = '很抱歉，提供的文档中没有包含关XXXX具体规范。因此，我无法直接为您提供相关信息。如果您需要了解XXXXX的国家规范、行业规范或地方规范，建议您咨询专业的工程师或者查阅相关的技术文献和标准数据库以获取详细信息。';
          aiRefs = ['推荐文件链接 1', '推荐文件链接 2'];
        }

        const aiMsg = { 
          role: 'assistant', 
          content: aiContent, 
          timestamp: new Date().toISOString(),
          references: aiRefs
        };
        if (chatId) {
          await addDoc(collection(db, 'chats', chatId, 'messages'), aiMsg);
        }
      }, 1000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${chatId}/messages`);
    }
  };

  const handleAction = async (messageId: string, action: 'favorite' | 'like' | 'dislike' | 'copy') => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    if (action === 'copy') {
      navigator.clipboard.writeText(msg.content);
      alert('已复制到剪贴板');
      return;
    }

    if (action === 'dislike') {
      setDislikeModal({ isOpen: true, messageId });
      return;
    }

    if (isMockUser) {
      const updater = (prevMessages: Message[]) => prevMessages.map(m => {
        if (m.id === messageId) {
          if (action === 'favorite') return { ...m, isFavorited: !m.isFavorited };
          if (action === 'like') return { ...m, likeStatus: m.likeStatus === 'like' ? null : 'like' };
        }
        return m;
      });
      setMessages(prev => updater(prev));
      if (currentChatId) {
        setMockMessagesByChat(prev => ({
          ...prev,
          [currentChatId]: updater(prev[currentChatId] ?? []),
        }));
      }
      return;
    }

    try {
      const updates: any = {};
      if (action === 'favorite') updates.isFavorited = !msg.isFavorited;
      if (action === 'like') updates.likeStatus = msg.likeStatus === 'like' ? null : 'like';
      
      await setDoc(doc(db, 'chats', currentChatId!, 'messages', messageId), updates, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${currentChatId}/messages/${messageId}`);
    }
  };

  const submitDislike = async (comment: string) => {
    if (!dislikeModal.messageId) return;

    if (isMockUser) {
      const updater = (prevMessages: Message[]) => prevMessages.map(m => {
        if (m.id === dislikeModal.messageId) {
          return { ...m, likeStatus: 'dislike', dislikeComment: comment };
        }
        return m;
      });
      setMessages(prev => updater(prev));
      if (currentChatId) {
        setMockMessagesByChat(prev => ({
          ...prev,
          [currentChatId]: updater(prev[currentChatId] ?? []),
        }));
      }
      setDislikeModal({ isOpen: false, messageId: null });
      return;
    }

    try {
      await setDoc(doc(db, 'chats', currentChatId!, 'messages', dislikeModal.messageId), {
        likeStatus: 'dislike',
        dislikeComment: comment
      }, { merge: true });
      setDislikeModal({ isOpen: false, messageId: null });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${currentChatId}/messages/${dislikeModal.messageId}`);
    }
  };

  const toggleKB = (name: string) => {
    setSelectedKBs(prev => 
      prev.includes(name) ? prev.filter(k => k !== name) : [...prev, name]
    );
  };

  return (
    <div className="flex h-full bg-[#F4F7FB] relative overflow-hidden">
      {/* Main Chat Area */}
      <div
        className="flex-1 flex flex-col min-w-0 px-6 py-6 relative"
        style={isReferenceOpen ? { paddingRight: referenceWidth + 28 } : undefined}
      >
        {isRetrievalTest && (
          <div className="absolute top-4 right-6 z-20">
            <button 
              onClick={onExitRetrievalTest}
              className="bg-white/80 backdrop-blur border border-slate-200 px-6 py-2 rounded-full shadow-lg flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-all font-bold"
            >
              <LogOut size={18} />
              <span>退出检索测试</span>
            </button>
          </div>
        )}
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mt-12 bg-white rounded-[2.5rem] p-12 shadow-sm border border-slate-100"
          >
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white shrink-0">
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-3 h-3 border border-white"></div>
                  <div className="w-3 h-3 border border-white"></div>
                  <div className="w-3 h-3 border border-white"></div>
                  <div className="w-3 h-3 border border-white"></div>
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">您好！我是研究中心AI+助手！</h2>
                <p className="text-slate-600 leading-relaxed">
                  我是您的规划师小助手，我可以为您提供准确、专业、全面的规划知识和案例知识问答及服务。
                </p>
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-400">您可以问我：</p>
                  <div className="space-y-2">
                    <button onClick={() => setInputValue('问题案例1')} className="block text-blue-500 hover:underline text-sm text-left">问题案例1</button>
                    <button onClick={() => setInputValue('问题案例2')} className="block text-blue-500 hover:underline text-sm text-left">问题案例2</button>
                    <button onClick={() => setInputValue('问题案例3')} className="block text-blue-500 hover:underline text-sm text-left">问题案例3</button>
                    <button onClick={() => setInputValue('问题案例4')} className="block text-blue-500 hover:underline text-sm text-left">问题案例4</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                  msg.role === 'assistant' ? 'bg-black text-white' : 'bg-blue-500 text-white'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="grid grid-cols-2 gap-0.5 scale-75">
                      <div className="w-2.5 h-2.5 border border-white"></div>
                      <div className="w-2.5 h-2.5 border border-white"></div>
                      <div className="w-2.5 h-2.5 border border-white"></div>
                      <div className="w-2.5 h-2.5 border border-white"></div>
                    </div>
                  ) : <User size={20} />}
                </div>
                <div className={`max-w-[72%] space-y-3 ${msg.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-6 rounded-[2.25rem] shadow-sm border ${
                    msg.role === 'assistant' 
                      ? 'bg-white border-slate-100 text-slate-800' 
                      : 'bg-white border-slate-100 text-slate-800'
                  }`}>
                    {msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    ) : msg.type === 'diagram' ? (
                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
                            <div className="grid grid-cols-2 gap-0.5 scale-75">
                              <div className="w-3 h-3 border border-white"></div>
                              <div className="w-3 h-3 border border-white"></div>
                              <div className="w-3 h-3 border border-white"></div>
                              <div className="w-3 h-3 border border-white"></div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="relative w-full aspect-[2/1] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center group">
                              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                <div className="w-full h-px bg-slate-400 rotate-[22deg]"></div>
                                <div className="w-full h-px bg-slate-400 -rotate-[22deg]"></div>
                              </div>
                              <div className="flex flex-col items-center gap-2 text-slate-300 transition-transform group-hover:scale-110">
                                <Plus size={48} className="rotate-45" />
                                <span className="text-xs font-medium uppercase tracking-widest">Placeholder</span>
                              </div>
                              
                              {/* Red numbered circles overlay */}
                              <div className="absolute top-4 right-4 flex gap-2">
                                {[16, 17, 18, 19].map(num => (
                                  <div key={num} className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-lg border-2 border-white ring-1 ring-red-600/20">
                                    {num}
                                  </div>
                                ))}
                              </div>
                              <div className="absolute bottom-4 left-4">
                                <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-lg border-2 border-white ring-1 ring-red-600/20">
                                  15
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-slate-500 italic px-2 border-l-2 border-slate-200 ml-14">
                          以上为为您生成的案例分析图示，您可以根据图示中的编号查看对应的详细说明。
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    )}
                  </div>
                  
                  {msg.role === 'assistant' && (
                    <div className="space-y-4 px-4">
                      {msg.references && (
                        <div className="space-y-2">
                          {msg.references.map((ref, idx) => (
                            <button 
                              key={idx}
                              onClick={() => {
                                setSelectedReference(ref);
                                setIsReferenceOpen(true);
                              }}
                              className="flex items-center gap-2 text-blue-500 hover:underline text-sm font-medium"
                            >
                              <LinkIcon size={14} />
                              <span>{ref}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-6 text-slate-400">
                        <button 
                          onClick={() => handleAction(msg.id, 'favorite')}
                          className={`transition-colors ${msg.isFavorited ? 'text-red-500' : 'hover:text-red-500'}`}
                        >
                          <Heart size={20} fill={msg.isFavorited ? 'currentColor' : 'none'} />
                        </button>
                        <button 
                          onClick={() => handleAction(msg.id, 'like')}
                          className={`transition-colors ${msg.likeStatus === 'like' ? 'text-blue-500' : 'hover:text-blue-500'}`}
                        >
                          <ThumbsUp size={20} fill={msg.likeStatus === 'like' ? 'currentColor' : 'none'} />
                        </button>
                        <button 
                          onClick={() => handleAction(msg.id, 'dislike')}
                          className={`transition-colors ${msg.likeStatus === 'dislike' ? 'text-slate-600' : 'hover:text-slate-600'}`}
                        >
                          <ThumbsDown size={20} fill={msg.likeStatus === 'dislike' ? 'currentColor' : 'none'} />
                        </button>
                        <button 
                          onClick={() => handleAction(msg.id, 'copy')}
                          className="hover:text-blue-500 transition-colors"
                        >
                          <Copy size={20} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="mt-8 max-w-5xl mx-auto w-full relative">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2">
            <button 
              onClick={onNewChat}
              className="w-10 h-10 bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-200 flex items-center justify-center hover:scale-110 transition-transform"
            >
              <Plus size={24} />
            </button>
          </div>
          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-end gap-4">
            <textarea 
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                  e.currentTarget.style.height = 'auto';
                }
              }}
              placeholder="给研究中心AI+助手发消息"
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-slate-700 placeholder:text-slate-300 resize-none py-2 min-h-[60px] max-h-[200px] custom-scrollbar"
              rows={1}
            />
            <div className="flex items-center gap-4 mb-2">
              <button 
                onClick={() => alert('上传附件功能暂未开放')}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                title="上传图片或文档"
              >
                <Paperclip size={28} />
              </button>
              <button 
                onClick={() => handleSend()}
                disabled={!inputValue.trim()}
                className="p-2 text-slate-400 hover:text-blue-500 transition-colors disabled:opacity-30"
              >
                <Send size={28} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reference Sidebar (center floating panel) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40">
        <motion.div
          initial={false}
          animate={{ width: isReferenceOpen ? referenceWidth : 24, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="h-[420px] flex flex-col overflow-visible relative"
        >
          {isReferenceOpen && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizingReference(true);
              }}
              className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-200/60 z-10"
              title="拖拽调整宽度"
            />
          )}
          <button
            onClick={() => setIsReferenceOpen(!isReferenceOpen)}
            className="absolute left-0 top-[132px] -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:text-slate-700 bg-white z-20 shadow-sm flex items-center gap-1"
            title={isReferenceOpen ? '收起参考知识库' : '展开参考知识库'}
          >
            {!isReferenceOpen && <span className="text-[10px] font-bold">参考</span>}
            {isReferenceOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <div className={`p-2 h-full flex flex-col transition-opacity ${isReferenceOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className={`bg-white rounded-[1rem] p-2 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden ${selectedReference ? 'flex-1' : ''}`}>
                {selectedReference ? (
                  <div className="flex-1 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-6">
                      <button 
                        onClick={() => setSelectedReference(null)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <h3 className="font-bold text-slate-800 truncate">原文预览: {selectedReference}</h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                      <div className="space-y-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">原文档内容</p>
                        <div className="text-xs text-slate-600 leading-relaxed space-y-3">
                          <p>第一章 总则</p>
                          <p>第一条 为了加强城市规划管理，保障城市规划的实施，根据有关法律、法规，结合本市实际，制定本条例。</p>
                          <p className="bg-yellow-100 p-2 rounded">第二条 在本市行政区域内制定和实施城市规划，在城市规划区内进行建设，必须遵守本条例。</p>
                          <p>第三条 城市规划的制定和实施，应当遵循城乡统筹、合理布局、节约用地、集约发展和先规划后建设的原则。</p>
                          <p>第四条 任何单位和个人都有遵守城市规划的义务，并有权对违反城市规划的行为进行检举和控告。</p>
                          <p>...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4 px-3">
                      <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                      <h3 className="font-bold text-sm text-slate-800">参考知识库</h3>
                    </div>
                    
                    <div className="space-y-2 flex-1">
                      {[
                        { name: '规范知识库' },
                        { name: '案例知识库' },
                        { name: '技术文件知识库' }
                      ].map((kb) => (
                        <div 
                          key={kb.name} 
                          onClick={() => toggleKB(kb.name)}
                          className="px-3 py-2 rounded-lg border border-slate-100 flex items-center justify-between gap-2 group hover:border-blue-200 transition-all cursor-pointer"
                        >
                          <span className="text-xs font-medium text-slate-600 whitespace-nowrap truncate">{kb.name}</span>
                          <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center ${selectedKBs.includes(kb.name) ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300 text-transparent'}`}>
                            {selectedKBs.includes(kb.name) && <span className="text-[9px] font-bold">√</span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button className="mt-3 w-full py-1.5 bg-slate-300 text-slate-700 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold hover:bg-slate-400 transition-all">
                      <Plus size={14} className="border border-slate-700 rounded p-0.5" />
                      <span>添加文件</span>
                    </button>
                  </div>
                )}
            </div>
          </div>
        </motion.div>
      </div>

      <DislikeCommentModal 
        isOpen={dislikeModal.isOpen}
        onClose={() => setDislikeModal({ isOpen: false, messageId: null })}
        onSubmit={submitDislike}
      />
    </div>
  );
}

function DislikeCommentModal({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (comment: string) => void }) {
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
      >
        <h3 className="text-xl font-bold text-slate-800 mb-4">反馈建议</h3>
        <p className="text-slate-500 text-sm mb-6">请告诉我们您不喜欢这条回答的原因，帮助我们改进。</p>
        <textarea 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="请输入您的建议..."
          className="w-full h-32 bg-slate-50 border-none rounded-2xl p-4 text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/20 resize-none mb-6"
        />
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
          >
            取消
          </button>
          <button 
            onClick={() => {
              onSubmit(comment);
              setComment('');
            }}
            className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 transition-colors"
          >
            提交
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function HistoryModal({ isOpen, onClose, chats, onChatSelect }: { isOpen: boolean, onClose: () => void, chats: any[], onChatSelect: (id: string) => void }) {
  if (!isOpen) return null;

  // Sort chats by date (most recent first)
  const sortedChats = [...chats].sort((a, b) => {
    const dateA = new Date(a.lastMessageAt || a.createdAt).getTime();
    const dateB = new Date(b.lastMessageAt || b.createdAt).getTime();
    return dateB - dateA;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[2rem] w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">历史对话</h3>
              <p className="text-[10px] text-slate-400">查看过往所有记录</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {sortedChats.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-3">
              <MessageSquare size={32} className="opacity-20" />
              <p className="text-sm">暂无历史对话</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onChatSelect(chat.id)}
                  className="group w-full p-4 bg-slate-50 rounded-xl border border-slate-100 text-left hover:bg-white hover:border-blue-200 hover:shadow-md transition-all flex items-center gap-4"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0">
                    <MessageSquare size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors text-sm">
                        {chat.title || '无标题对话'}
                      </h4>
                      <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap ml-2">
                        {new Date(chat.lastMessageAt || chat.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      点击继续交流...
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function CreateKBModal({ isOpen, onClose, currentUser, isMockUser, onKBAdded, editingKB }: { isOpen: boolean, onClose: () => void, currentUser: any, isMockUser: boolean, onKBAdded?: (kb: KnowledgeBase) => void, editingKB?: KnowledgeBase | null }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const isNameEmpty = !name.trim();
  const isDescriptionEmpty = !description.trim();

  useEffect(() => {
    if (editingKB) {
      setName(editingKB.name);
      setDescription(editingKB.description);
    } else {
      setName('');
      setDescription('');
    }
    setShowValidation(false);
  }, [editingKB, isOpen]);

  const handleSubmit = async () => {
    setShowValidation(true);
    if (!name.trim() || !description.trim() || !currentUser) return;
    setLoading(true);

    if (isMockUser) {
      const kbData: KnowledgeBase = editingKB ? {
        ...editingKB,
        name,
        description
      } : {
        id: `KB${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        name,
        description,
        fileCount: 0,
        indexCount: 0,
        createdAt: new Date().toISOString().replace('T', ' ').split('.')[0]
      };
      
      if (onKBAdded) onKBAdded(kbData);
      
      alert(`演示模式：知识库${editingKB ? '更新' : '创建'}成功（仅本地可见）`);
      onClose();
      setLoading(false);
      return;
    }

    try {
      if (editingKB) {
        await setDoc(doc(db, 'knowledgeBases', editingKB.id), {
          name,
          description,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } else {
        await addDoc(collection(db, 'knowledgeBases'), {
          name,
          description,
          createdBy: currentUser.uid,
          createdAt: new Date().toISOString(),
          fileCount: 0,
          indexCount: 0
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, editingKB ? OperationType.UPDATE : OperationType.CREATE, 'knowledgeBases');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">{editingKB ? '编辑知识库' : '创建知识库'}</h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    名称 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={name}
                      onBlur={() => setShowValidation(true)}
                      onChange={(e) => setName(e.target.value.slice(0, 100))}
                      placeholder="请输入"
                      className={`w-full px-4 py-2 bg-white border rounded focus:ring-2 text-sm ${
                        showValidation && isNameEmpty
                          ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
                          : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                    <span className="absolute right-3 bottom-2 text-[10px] text-slate-400">{name.length}/100</span>
                  </div>
                  {showValidation && isNameEmpty && (
                    <p className="mt-1 text-xs text-red-500">知识库名称为必填项</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    描述 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea 
                      value={description}
                      onBlur={() => setShowValidation(true)}
                      onChange={(e) => setDescription(e.target.value.slice(0, 800))}
                      placeholder="请输入知识库描述，以便于大模型更好的理解知识库内容"
                      className={`w-full px-4 py-2 bg-white border rounded focus:ring-2 text-sm h-32 resize-none ${
                        showValidation && isDescriptionEmpty
                          ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
                          : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                    <span className="absolute right-3 bottom-2 text-[10px] text-slate-400">{description.length}/800</span>
                  </div>
                  {showValidation && isDescriptionEmpty && (
                    <p className="mt-1 text-xs text-red-500">知识库描述为必填项</p>
                  )}
                </div>
              </div>

              <div className="mt-10 flex justify-end gap-4">
                <button 
                  onClick={onClose}
                  className="px-8 py-2 border border-slate-300 rounded text-slate-600 font-medium hover:bg-slate-50 transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading || !name.trim() || !description.trim()}
                  className="px-8 py-2 bg-[#1890FF] text-white rounded font-medium hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  {loading ? (editingKB ? '更新中...' : '创建中...') : '确认'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
