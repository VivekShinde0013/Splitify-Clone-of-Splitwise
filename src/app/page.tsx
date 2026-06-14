"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  MessageSquare,
  LogOut,
  UserPlus,
  IndianRupee,
  ArrowRight,
  CheckCircle,
  Activity,
  Users,
  CreditCard,
  X,
  Send,
  Loader2,
  Calendar,
  MessageCircle,
  Smartphone,
  Plane,
  Home as HomeIcon,
  Heart,
  Star,
  Quote,
  Apple
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Group {
  id: string;
  name: string;
  members?: { user: User }[];
}

interface ExpenseSplit {
  id: string;
  userId: string;
  amount: number;
  ratioVal?: number;
  user: User;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidById: string;
  splitType: string;
  createdAt: string;
  paidBy: User;
  splits: ExpenseSplit[];
}

interface Payment {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  createdAt: string;
  fromUser: User;
  toUser: User;
}

interface ChatMessage {
  id: string;
  expenseId: string;
  userId: string;
  message: string;
  createdAt: string;
  user: User;
}

interface GroupDetailsResponse {
  group: Group & { expenses: Expense[]; payments: Payment[] };
  balances: {
    id: string;
    name: string;
    email: string;
    totalPaid: number;
    totalOwed: number;
    totalReceived: number;
    totalSettled: number;
    netBalance: number;
  }[];
  simplifiedDebts: {
    fromUser: User;
    toUser: User;
    amount: number;
  }[];
}
const airplaneTriangles = [
  // Left Wing
  { points: "250,250 100,280 200,200", color: "#14b8a6" },
  { points: "100,280 200,200 80,290", color: "#0d9488" },
  { points: "200,200 250,160 250,250", color: "#2dd4bf" },
  // Right Wing
  { points: "250,250 400,280 300,200", color: "#0f766e" },
  { points: "400,280 300,200 420,290", color: "#115e59" },
  { points: "300,200 250,160 250,250", color: "#14b8a6" },
  // Nose / Fuselage Front
  { points: "250,50 220,150 250,160", color: "#5eead4" },
  { points: "250,50 280,150 250,160", color: "#2dd4bf" },
  { points: "220,150 200,200 250,160", color: "#14b8a6" },
  { points: "280,150 300,200 250,160", color: "#0d9488" },
  // Rear Fuselage
  { points: "250,250 230,350 250,380", color: "#0f766e" },
  { points: "250,250 270,350 250,380", color: "#115e59" },
  // Tail Fins
  { points: "230,350 160,370 200,340", color: "#14b8a6" },
  { points: "270,350 340,370 300,340", color: "#0d9488" }
];

const houseTriangles = [
  // Roof Left
  { points: "250,50 120,170 200,170", color: "#a78bfa" },
  { points: "250,50 200,170 250,170", color: "#8b5cf6" },
  // Roof Right
  { points: "250,50 380,170 300,170", color: "#7c3aed" },
  { points: "250,50 300,170 250,170", color: "#6d28d9" },
  // Chimney
  { points: "320,100 350,100 350,140", color: "#5b21b6" },
  { points: "320,100 320,140 350,140", color: "#4c1d95" },
  // House Main Wall Left
  { points: "150,170 250,170 150,270", color: "#8b5cf6" },
  { points: "250,170 150,270 250,270", color: "#7c3aed" },
  { points: "150,270 250,270 150,370", color: "#6d28d9" },
  { points: "250,270 150,370 250,370", color: "#5b21b6" },
  // House Main Wall Right
  { points: "250,170 350,170 250,270", color: "#7c3aed" },
  { points: "350,170 250,270 350,270", color: "#6d28d9" },
  { points: "250,270 350,270 250,370", color: "#5b21b6" },
  { points: "350,270 350,370 250,370", color: "#4c1d95" },
  // Door/Details
  { points: "220,290 280,290 250,320", color: "#ddd6fe" },
  { points: "220,290 220,370 250,320", color: "#c4b5fd" },
  { points: "280,290 280,370 250,320", color: "#a78bfa" },
  { points: "220,370 280,370 250,320", color: "#8b5cf6" }
];

const heartTriangles = [
  // Top Left Lobe
  { points: "250,150 180,80 120,120", color: "#fda4af" },
  { points: "250,150 120,120 120,180", color: "#f43f5e" },
  { points: "250,150 120,180 180,220", color: "#e11d48" },
  // Top Right Lobe
  { points: "250,150 320,80 380,120", color: "#f43f5e" },
  { points: "250,150 380,120 380,180", color: "#e11d48" },
  { points: "250,150 380,180 320,220", color: "#be123c" },
  // Center / Lower Left
  { points: "120,180 180,220 100,240", color: "#be123c" },
  { points: "180,220 250,260 150,310", color: "#9f1239" },
  { points: "180,220 150,310 100,240", color: "#881337" },
  // Center / Lower Right
  { points: "380,180 320,220 400,240", color: "#9f1239" },
  { points: "320,220 250,260 350,310", color: "#881337" },
  { points: "320,220 350,310 400,240", color: "#4c0519" },
  // Bottom Tip
  { points: "250,260 150,310 250,390", color: "#be123c" },
  { points: "250,260 350,310 250,390", color: "#9f1239" }
];

const asteriskTriangles = [
  // Center core
  { points: "250,220 220,220 250,190", color: "#9ca3af" },
  { points: "250,220 280,220 250,190", color: "#d1d5db" },
  { points: "250,220 220,220 250,250", color: "#6b7280" },
  { points: "250,220 280,220 250,250", color: "#4b5563" },
  // Up spoke
  { points: "250,190 220,220 250,80", color: "#9ca3af" },
  { points: "250,190 280,220 250,80", color: "#d1d5db" },
  // Down spoke
  { points: "250,250 220,220 250,360", color: "#4b5563" },
  { points: "250,250 280,220 250,360", color: "#374151" },
  // Top-Left spoke
  { points: "220,220 250,190 130,150", color: "#9ca3af" },
  { points: "220,220 250,250 130,150", color: "#6b7280" },
  // Top-Right spoke
  { points: "280,220 250,190 370,150", color: "#e5e7eb" },
  { points: "280,220 250,250 370,150", color: "#9ca3af" },
  // Bottom-Left spoke
  { points: "220,220 250,250 130,290", color: "#4b5563" },
  { points: "220,220 250,190 130,290", color: "#374151" },
  // Bottom-Right spoke
  { points: "280,220 250,250 370,290", color: "#374151" },
  { points: "280,220 250,190 370,290", color: "#1f2937" }
];

const landingThemes = {
  trips: {
    color: "#1CC29F",
    accent: "text-[#1CC29F]",
    bg: "bg-[#1CC29F]",
    hoverBg: "hover:bg-[#12B291]",
    btnShadow: "shadow-[0_4px_14px_rgba(28,194,159,0.4)]",
    text: "on trips.",
    triangles: airplaneTriangles,
  },
  housemates: {
    color: "#8656CD",
    accent: "text-[#8656CD]",
    bg: "bg-[#8656CD]",
    hoverBg: "hover:bg-[#7245B8]",
    btnShadow: "shadow-[0_4px_14px_rgba(134,86,205,0.4)]",
    text: "with housemates.",
    triangles: houseTriangles,
  },
  partner: {
    color: "#A6002F",
    accent: "text-[#A6002F]",
    bg: "bg-[#A6002F]",
    hoverBg: "hover:bg-[#8B0025]",
    btnShadow: "shadow-[0_4px_14px_rgba(166,0,47,0.4)]",
    text: "with your partner.",
    triangles: heartTriangles,
  },
  anyone: {
    color: "#1CC29F",
    accent: "text-[#1CC29F]",
    bg: "bg-[#1CC29F]",
    hoverBg: "hover:bg-[#12B291]",
    btnShadow: "shadow-[0_4px_14px_rgba(28,194,159,0.4)]",
    text: "with anyone.",
    triangles: asteriskTriangles,
  }
};

export default function Home() {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"trips" | "housemates" | "partner" | "anyone">("trips");

  // --- Dashboard State ---
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  // --- Active Group State ---
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupDetailsResponse | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState("");
  const [memberMessage, setMemberMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [allGroupsDetails, setAllGroupsDetails] = useState<GroupDetailsResponse[]>([]);

  // --- Modals State ---
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [settleUpOpen, setSettleUpOpen] = useState(false);

  // --- Expense Form State ---
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePayerId, setExpensePayerId] = useState("");
  const [expenseSplitType, setExpenseSplitType] = useState<"EQUAL" | "UNEQUAL" | "PERCENTAGE" | "SHARE">("EQUAL");
  const [expenseSplitsConfig, setExpenseSplitsConfig] = useState<Record<string, { selected: boolean; value: string }>>({});
  const [expenseError, setExpenseError] = useState("");
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);

  // --- Settle Up Form State ---
  const [settleFromUserId, setSettleFromUserId] = useState("");
  const [settleToUserId, setSettleToUserId] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [settleError, setSettleError] = useState("");
  const [settleSubmitting, setSettleSubmitting] = useState(false);

  // --- Expense Detail & Chat State ---
  const [activeExpenseChat, setActiveExpenseChat] = useState<Expense | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSubmitting, setChatSubmitting] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // --- CSV Import State ---
  const [importCSVOpen, setImportCSVOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importProcessedEntries, setImportProcessedEntries] = useState<any[]>([]);
  const [importDuplicates, setImportDuplicates] = useState<any[]>([]);
  const [importAnomalies, setImportAnomalies] = useState<any[]>([]);
  const [importTotalRows, setImportTotalRows] = useState(0);
  const [duplicateResolutions, setDuplicateResolutions] = useState<Record<string, string>>({});
  const [importError, setImportError] = useState("");

  // --- Debt Breakdown State ---
  const [debtBreakdownModal, setDebtBreakdownModal] = useState<{
    fromUser: User;
    toUser: User;
    amount: number;
    items: {
      date: string;
      description: string;
      total: number;
      share: number;
      type: string;
      text: string;
      netEffect: number;
    }[];
  } | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("splitify_user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setAuthLoading(false);
  }, []);

  // Fetch groups when user changes
  useEffect(() => {
    if (currentUser) {
      fetchGroups();
      fetchUsers();
    } else {
      setGroups([]);
      setActiveGroupId(null);
      setGroupDetails(null);
      setAllGroupsDetails([]);
    }
  }, [currentUser]);

  // Fetch group details when active group changes
  useEffect(() => {
    if (activeGroupId) {
      fetchGroupDetails(activeGroupId);
    } else {
      setGroupDetails(null);
    }
  }, [activeGroupId]);

  // Fetch all groups details to aggregate balances
  useEffect(() => {
    if (currentUser && groups.length > 0) {
      Promise.all(
        groups.map((g) =>
          fetch(`/api/groups/${g.id}`).then((res) => {
            if (res.ok) return res.json();
            return null;
          })
        )
      )
        .then((detailsList) => {
          setAllGroupsDetails(detailsList.filter(Boolean) as GroupDetailsResponse[]);
        })
        .catch((err) => {
          console.error("Error fetching all group details:", err);
        });
    } else {
      setAllGroupsDetails([]);
    }
  }, [groups, currentUser]);

  // Polling chat messages when active expense chat is open
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeExpenseChat) {
      fetchChats(activeExpenseChat.id);
      interval = setInterval(() => {
        fetchChats(activeExpenseChat.id, true);
      }, 4000);
    } else {
      setChatMessages([]);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeExpenseChat]);

  // Scroll chat to bottom when messages load
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Set default values for expense form when members are loaded
  useEffect(() => {
    if (addExpenseOpen && groupDetails) {
      const config: Record<string, { selected: boolean; value: string }> = {};
      const members = groupDetails.group.members || [];
      members.forEach((m) => {
        config[m.user.id] = { selected: true, value: "" };
      });
      setExpenseSplitsConfig(config);
      setExpensePayerId(currentUser?.id || (members[0]?.user.id ?? ""));
    }
  }, [addExpenseOpen, groupDetails]);

  // API Call: Fetch Users for search invite
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // API Call: Fetch groups
  const fetchGroups = async () => {
    if (!currentUser) return;
    setGroupsLoading(true);
    try {
      const res = await fetch(`/api/groups?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGroupsLoading(false);
    }
  };

  // API Call: Fetch active group details
  const fetchGroupDetails = async (id: string) => {
    setGroupLoading(true);
    try {
      const res = await fetch(`/api/groups/${id}`);
      if (res.ok) {
        const data = await res.json();
        setGroupDetails(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGroupLoading(false);
    }
  };

  // API Call: Fetch Chats
  const fetchChats = async (expenseId: string, isPoll = false) => {
    if (!isPoll) setChatLoading(true);
    try {
      const res = await fetch(`/api/expenses/${expenseId}/chats`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isPoll) setChatLoading(false);
    }
  };

  // --- Handler: Show Debt Breakdown (Rohan's Request) ---
  const handleShowDebtBreakdown = (fromUser: User, toUser: User, amount: number) => {
    if (!groupDetails) return;
    const items: any[] = [];

    // Scan expenses
    groupDetails.group.expenses.forEach((exp) => {
      const isFromUserSplitMember = exp.splits.some((s) => s.userId === fromUser.id);
      const isFromUserPayer = exp.paidById === fromUser.id;
      const isToUserSplitMember = exp.splits.some((s) => s.userId === toUser.id);
      const isToUserPayer = exp.paidById === toUser.id;

      if (isToUserPayer && isFromUserSplitMember) {
        // toUser paid, fromUser owes
        const split = exp.splits.find((s) => s.userId === fromUser.id);
        const share = split ? split.amount : 0;
        items.push({
          date: exp.createdAt,
          description: exp.description,
          total: exp.amount,
          share,
          type: "OWE",
          text: `${fromUser.name} owed for split`,
          netEffect: -share,
        });
      } else if (isFromUserPayer && isToUserSplitMember) {
        // fromUser paid, toUser owes
        const split = exp.splits.find((s) => s.userId === toUser.id);
        const share = split ? split.amount : 0;
        items.push({
          date: exp.createdAt,
          description: exp.description,
          total: exp.amount,
          share,
          type: "LENT",
          text: `${toUser.name} owed for split`,
          netEffect: share,
        });
      }
    });

    // Scan payments
    groupDetails.group.payments.forEach((pay) => {
      if (pay.fromUserId === fromUser.id && pay.toUserId === toUser.id) {
        // fromUser paid toUser
        items.push({
          date: pay.createdAt,
          description: "Settlement Payment",
          total: pay.amount,
          share: pay.amount,
          type: "PAYMENT_SENT",
          text: `Payment from ${fromUser.name} to ${toUser.name}`,
          netEffect: pay.amount,
        });
      } else if (pay.fromUserId === toUser.id && pay.toUserId === fromUser.id) {
        // toUser paid fromUser
        items.push({
          date: pay.createdAt,
          description: "Settlement Payment",
          total: pay.amount,
          share: pay.amount,
          type: "PAYMENT_RCVD",
          text: `Payment from ${toUser.name} to ${fromUser.name}`,
          netEffect: -pay.amount,
        });
      }
    });

    // Sort items chronologically
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setDebtBreakdownModal({
      fromUser,
      toUser,
      amount,
      items,
    });
  };

  // --- CSV Import Handlers ---
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportLoading(true);
    setImportError("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      try {
        const res = await fetch(`/api/groups/${activeGroupId}/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText }),
        });

        const data = await res.json();
        if (res.ok) {
          setImportProcessedEntries(data.processedEntries || []);
          setImportDuplicates(data.duplicatesToResolve || []);
          setImportAnomalies(data.anomalies || []);
          setImportTotalRows(data.totalRows || 0);

          // Initialize duplicate resolutions
          const initialResolutions: Record<string, string> = {};
          data.duplicatesToResolve.forEach((group: any) => {
            group.rows.forEach((row: any) => {
              initialResolutions[row.rowNum] = row.defaultAction;
            });
          });
          setDuplicateResolutions(initialResolutions);
          setImportStep(2);
        } else {
          setImportError(data.error || "Failed to parse CSV file.");
        }
      } catch (err: any) {
        setImportError(err.message || "An unexpected error occurred.");
      } finally {
        setImportLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleResolveDuplicate = (rowNum: number, action: "KEEP" | "DELETE", siblingRowNums: number[]) => {
    const newResolutions = { ...duplicateResolutions };
    newResolutions[rowNum] = action;

    if (action === "KEEP") {
      siblingRowNums.forEach((sRow) => {
        newResolutions[sRow] = "DELETE";
      });
    }

    setDuplicateResolutions(newResolutions);
  };

  const handleConfirmImport = async () => {
    const unresolved = Object.values(duplicateResolutions).some((v) => v === "RESOLVE_REQUIRED");
    if (unresolved) {
      setImportError("Please resolve all conflicting duplicates before proceeding.");
      return;
    }

    setImportLoading(true);
    setImportError("");

    try {
      const allEntries = [
        ...importProcessedEntries.map((e) => ({ ...e, action: "KEEP" })),
      ];

      importDuplicates.forEach((group: any) => {
        group.rows.forEach((row: any) => {
          allEntries.push({
            ...row,
            action: duplicateResolutions[row.rowNum] === "KEEP" ? "KEEP" : "DELETE",
          });
        });
      });

      const res = await fetch(`/api/groups/${activeGroupId}/import/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: allEntries,
          anomalies: importAnomalies,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportStep(3);
        if (activeGroupId) {
          fetchGroupDetails(activeGroupId);
        }
      } else {
        setImportError(data.error || "Failed to confirm import.");
      }
    } catch (err: any) {
      setImportError(err.message || "An error occurred during import.");
    } finally {
      setImportLoading(false);
    }
  };

  const closeImportWizard = () => {
    setImportCSVOpen(false);
    setImportStep(1);
    setImportFile(null);
    setImportProcessedEntries([]);
    setImportDuplicates([]);
    setImportAnomalies([]);
    setDuplicateResolutions({});
    setImportError("");
  };

  // Handler: Login / Signup
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword;
    const name = loginName.trim();

    if (isSignUp) {
      if (!name || !email || !password) {
        setLoginError("Name, Email, and Password are required");
        return;
      }
      if (password.length < 6) {
        setLoginError("Password must be at least 6 characters long");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setLoginError("Invalid email address format");
        return;
      }

      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setLoginError(data.error || "Sign up failed");
        } else {
          localStorage.setItem("splitify_user", JSON.stringify(data));
          setCurrentUser(data);
          setShowAuthForm(false);
          // Reset fields
          setLoginName("");
          setLoginEmail("");
          setLoginPassword("");
        }
      } catch (err: any) {
        setLoginError("Failed to connect to server");
      }
    } else {
      if (!email || !password) {
        setLoginError("Email and Password are required");
        return;
      }

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setLoginError(data.error || "Login failed");
        } else {
          localStorage.setItem("splitify_user", JSON.stringify(data));
          setCurrentUser(data);
          setShowAuthForm(false);
          // Reset fields
          setLoginName("");
          setLoginEmail("");
          setLoginPassword("");
        }
      } catch (err: any) {
        setLoginError("Failed to connect to server");
      }
    }
  };

  // Handler: Logout
  const handleLogout = () => {
    localStorage.removeItem("splitify_user");
    setCurrentUser(null);
  };

  // Handler: Create Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !currentUser) return;

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim(), userId: currentUser.id }),
      });

      const data = await res.json();
      if (res.ok) {
        setNewGroupName("");
        setCreateGroupOpen(false);
        fetchGroups();
        setActiveGroupId(data.id);
      }
    } catch (err) {
      console.error("Create group failed", err);
    }
  };

  // Handler: Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberMessage(null);
    if (!addMemberEmail.trim() || !activeGroupId) return;

    // Find user by email in global list
    const foundUser = usersList.find(
      (u) => u.email.toLowerCase() === addMemberEmail.trim().toLowerCase()
    );

    if (!foundUser) {
      setMemberMessage({
        text: "User email not found. Please register this user first by logging in as them.",
        isError: true,
      });
      return;
    }

    try {
      const res = await fetch(`/api/groups/${activeGroupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: foundUser.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMemberMessage({ text: data.error || "Failed to add member", isError: true });
      } else {
        setMemberMessage({ text: "Member added successfully!", isError: false });
        setAddMemberEmail("");
        fetchGroupDetails(activeGroupId);
      }
    } catch (err) {
      setMemberMessage({ text: "Failed to connect to server", isError: true });
    }
  };

  // Handler: Remove Member
  const handleRemoveMember = async (userId: string) => {
    if (!activeGroupId) return;
    if (confirm("Are you sure you want to remove this member?")) {
      try {
        const res = await fetch(`/api/groups/${activeGroupId}/members/${userId}`, {
          method: "DELETE",
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.error || "Failed to remove member");
        } else {
          fetchGroupDetails(activeGroupId);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Handler: Submit Expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError("");
    if (!expenseDesc.trim() || !expenseAmount || !expensePayerId || !activeGroupId) {
      setExpenseError("All fields are required");
      return;
    }

    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) {
      setExpenseError("Please enter a valid amount greater than 0");
      return;
    }

    // Build splits payload
    const splitsPayload: { userId: string; value?: number }[] = [];

    const selectedMembers = Object.entries(expenseSplitsConfig).filter(
      ([_, config]) => config.selected
    );

    if (selectedMembers.length === 0) {
      setExpenseError("You must select at least one person to split with");
      return;
    }

    if (expenseSplitType === "EQUAL") {
      selectedMembers.forEach(([uid]) => {
        splitsPayload.push({ userId: uid });
      });
    } else {
      // For UNEQUAL, PERCENTAGE, SHARE
      let totalValueInput = 0;
      for (const [uid, config] of selectedMembers) {
        const val = parseFloat(config.value);
        if (isNaN(val) || val < 0) {
          setExpenseError("Splits must have non-negative numeric values");
          return;
        }
        totalValueInput += val;
        splitsPayload.push({ userId: uid, value: val });
      }

      if (expenseSplitType === "UNEQUAL" && Math.abs(totalValueInput - amt) > 0.02) {
        setExpenseError(`Total of splits ($${totalValueInput.toFixed(2)}) must equal the expense amount ($${amt.toFixed(2)})`);
        return;
      }

      if (expenseSplitType === "PERCENTAGE" && Math.abs(totalValueInput - 100) > 0.01) {
        setExpenseError(`Percentages must sum to exactly 100% (currently ${totalValueInput.toFixed(1)}%)`);
        return;
      }

      if (expenseSplitType === "SHARE" && totalValueInput <= 0) {
        setExpenseError("Total shares must be greater than 0");
        return;
      }
    }

    setExpenseSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${activeGroupId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: expenseDesc.trim(),
          amount: amt,
          paidById: expensePayerId,
          splitType: expenseSplitType,
          splits: splitsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setExpenseError(data.error || "Failed to create expense");
      } else {
        setExpenseDesc("");
        setExpenseAmount("");
        setAddExpenseOpen(false);
        fetchGroupDetails(activeGroupId);
      }
    } catch (err) {
      setExpenseError("Failed to connect to server");
    } finally {
      setExpenseSubmitting(false);
    }
  };

  // Handler: Submit Settlement
  const handleSettleUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettleError("");
    if (!settleFromUserId || !settleToUserId || !settleAmount || !activeGroupId) {
      setSettleError("All fields are required");
      return;
    }

    if (settleFromUserId === settleToUserId) {
      setSettleError("Sender and receiver cannot be the same person");
      return;
    }

    const amt = parseFloat(settleAmount);
    if (isNaN(amt) || amt <= 0) {
      setSettleError("Enter a valid amount greater than 0");
      return;
    }

    setSettleSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${activeGroupId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: settleFromUserId,
          toUserId: settleToUserId,
          amount: amt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSettleError(data.error || "Failed to record settlement");
      } else {
        setSettleAmount("");
        setSettleUpOpen(false);
        fetchGroupDetails(activeGroupId);
      }
    } catch (err) {
      setSettleError("Failed to connect to server");
    } finally {
      setSettleSubmitting(false);
    }
  };

  // Handler: Post Chat Message
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !activeExpenseChat || !currentUser) return;

    setChatSubmitting(true);
    try {
      const res = await fetch(`/api/expenses/${activeExpenseChat.id}/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          message: newChatMessage.trim(),
        }),
      });

      if (res.ok) {
        setNewChatMessage("");
        fetchChats(activeExpenseChat.id, true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatSubmitting(false);
    }
  };

  // Helper: Live Split Calculation display
  const getCalculatedSplitAmount = (userId: string) => {
    const amt = parseFloat(expenseAmount) || 0;
    const config = expenseSplitsConfig[userId];
    if (!config || !config.selected) return 0;

    const selectedMembers = Object.entries(expenseSplitsConfig).filter(
      ([_, conf]) => conf.selected
    );
    const N = selectedMembers.length;

    if (expenseSplitType === "EQUAL") {
      return Number((amt / N).toFixed(2));
    }

    if (expenseSplitType === "UNEQUAL") {
      return parseFloat(config.value) || 0;
    }

    if (expenseSplitType === "PERCENTAGE") {
      const pct = parseFloat(config.value) || 0;
      return Number(((amt * pct) / 100).toFixed(2));
    }

    if (expenseSplitType === "SHARE") {
      const sh = parseFloat(config.value) || 0;
      let totalShares = 0;
      selectedMembers.forEach(([_, conf]) => {
        totalShares += parseFloat(conf.value) || 0;
      });
      if (totalShares <= 0) return 0;
      return Number(((amt * sh) / totalShares).toFixed(2));
    }

    return 0;
  };

  // --- RENDERING ---

  // Auth Loading View
  if (authLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-slate-950 text-slate-100">
        <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
        <p className="mt-4 text-slate-400 text-sm font-medium tracking-wide">Loading Splitify...</p>
      </div>
    );
  }

  // Login View
  if (!currentUser) {
    const currentTheme = landingThemes[activeTab];

    return (
      <div className="min-h-screen bg-white text-slate-800 bg-mesh flex flex-col overflow-x-hidden font-sans scroll-smooth">
        {/* --- HEADER NAVBAR --- */}
        <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 z-40 transition-all duration-200">
          <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => setActiveTab("trips")}>
              <svg className="w-8 h-8 mr-2.5 transition-transform hover:scale-105" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="50,15 15,75 50,60" fill="#1CC29F" className="hover-scale-triangle" />
                <polygon points="50,15 85,75 50,60" fill="#12B291" className="hover-scale-triangle" />
                <polygon points="15,75 85,75 50,60" fill="#0D9488" className="hover-scale-triangle" />
              </svg>
              <span className="font-black text-2xl text-slate-900 tracking-tight">Splitify</span>
            </div>

            {/* Nav Links */}
            <div className="flex items-center space-x-6">
              <button
                onClick={() => {
                  setLoginError("");
                  setIsSignUp(false);
                  setShowAuthForm(true);
                }}
                className="text-slate-600 hover:text-teal-500 font-bold text-sm transition cursor-pointer"
              >
                Log in
              </button>
              <button
                onClick={() => {
                  setLoginError("");
                  setIsSignUp(true);
                  setShowAuthForm(true);
                }}
                className={`bg-[#1CC29F] hover:bg-[#12B291] text-white font-bold text-sm px-4.5 py-2 rounded-lg transition active:scale-97 cursor-pointer`}
              >
                Sign up
              </button>
            </div>
          </div>
        </header>

        {/* --- HERO SECTION --- */}
        <section className="relative max-w-6xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column: Headline and Tabs */}
          <div className="space-y-8 max-w-xl">
            <h1 className="text-4.5xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]">
              Less stress when sharing expenses{" "}
              <span 
                className="transition-colors duration-300 block md:inline" 
                style={{ color: currentTheme.color }}
              >
                {currentTheme.text}
              </span>
            </h1>

            {/* Interactive Tab Switcher Row */}
            <div className="flex space-x-4">
              {(["trips", "housemates", "partner", "anyone"] as const).map((tab) => {
                const isActive = activeTab === tab;
                const theme = landingThemes[tab];
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                      isActive 
                        ? "bg-slate-50 border-slate-350 scale-105" 
                        : "bg-white border-slate-100 hover:border-slate-300 scale-95"
                    }`}
                    title={`Share expenses ${tab}`}
                    style={{ color: isActive ? theme.color : "#94A3B8" }}
                  >
                    {tab === "trips" && <Plane className="w-5 h-5" />}
                    {tab === "housemates" && <HomeIcon className="w-5 h-5" />}
                    {tab === "partner" && <Heart className="w-5 h-5 fill-current" />}
                    {tab === "anyone" && <Star className="w-5 h-5 fill-current" />}
                  </button>
                );
              })}
            </div>

            <p className="text-lg text-slate-500 leading-relaxed font-medium">
              Keep track of your shared expenses and balances with housemates, trips, groups, friends, and family.
            </p>

            <div>
              <button
                onClick={() => {
                  setLoginError("");
                  setIsSignUp(true);
                  setShowAuthForm(true);
                }}
                className={`text-white font-extrabold text-base px-8 py-3.5 rounded-xl transition duration-200 active:scale-97 cursor-pointer`}
                style={{ 
                  backgroundColor: currentTheme.color,
                  boxShadow: `0 8px 20px -6px ${currentTheme.color}`
                }}
              >
                Sign up
              </button>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Free for</span>
              <Apple className="w-3.5 h-3.5 inline text-slate-500" />
              <span>iPhone,</span>
              <Smartphone className="w-3.5 h-3.5 inline text-slate-500" />
              <span>Android, and web.</span>
            </div>
          </div>

          {/* Right Column: Custom Animated Geometric SVG */}
          <div className="flex justify-center items-center w-full min-h-[320px] md:min-h-[400px]">
            <div className="w-full max-w-[420px] aspect-square animate-float">
              <svg 
                className="w-full h-full drop-shadow-2xl" 
                viewBox="0 0 500 450" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Dynamically render faceted triangles of active tab */}
                {currentTheme.triangles.map((triangle, index) => (
                  <polygon
                    key={index}
                    points={triangle.points}
                    fill={triangle.color}
                    className="hover-scale-triangle transition-all duration-300 ease-in-out cursor-pointer"
                  />
                ))}
              </svg>
            </div>
          </div>
        </section>

        {/* --- DUAL MOCKUPS SECTION 1: Track Balances & Organize Expenses --- */}
        <section className="bg-slate-50 border-y border-slate-100 py-16">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden rounded-[32px] shadow-xl">
            {/* Left Box: Track Balances (Dark) */}
            <div className="bg-[#2E3134] text-white p-10 flex flex-col justify-between items-center text-center">
              <div className="max-w-md mb-8">
                <h3 className="text-2xl font-black">Track balances</h3>
                <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                  Keep track of shared expenses, balances, and who owes who.
                </p>
              </div>

              {/* Phone Mockup */}
              <div className="relative border-[8px] border-neutral-800 rounded-[32px] w-[250px] h-[400px] bg-[#f7f8f9] overflow-hidden shadow-2xl text-slate-800 flex flex-col">
                {/* Header status bar */}
                <div className="bg-neutral-900 text-white h-5 px-3 flex justify-between items-center text-[9px] font-mono select-none">
                  <span>2:41</span>
                  <div className="flex items-center space-x-1">
                    <span>LTE</span>
                    <Smartphone className="w-2.5 h-2.5" />
                  </div>
                </div>
                {/* Navbar */}
                <div className="p-2 border-b border-slate-200 flex justify-between items-center bg-white">
                  <span className="font-black text-xs">Friends</span>
                  <span className="text-[10px] text-teal-600 font-bold">Add friends</span>
                </div>
                {/* Summary Card */}
                <div className="m-2 p-2 bg-slate-100 rounded-lg text-left text-[9px] space-y-1">
                  <div className="text-slate-500 font-bold">Total balance</div>
                  <div className="text-rose-500 font-semibold">You owe ₹9,221.00</div>
                  <div className="text-teal-600 font-semibold">You are owed ₹6,977.00 + ₹1,550.50</div>
                </div>
                {/* Friends list scroll */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-left text-[9px]">
                  {/* Friend 1 */}
                  <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-100">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 font-bold text-[8px] flex items-center justify-center">EP</div>
                      <span className="font-bold">Earl E. Phant</span>
                    </div>
                    <span className="text-rose-500 font-bold">you owe ₹9,221.00</span>
                  </div>
                  {/* Friend 2 */}
                  <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-100">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 font-bold text-[8px] flex items-center justify-center">GJ</div>
                      <span className="font-bold">Gajah</span>
                    </div>
                    <span className="text-teal-600 font-bold">owes you ₹2,000.00</span>
                  </div>
                  {/* Friend 3 */}
                  <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-100">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-yellow-100 text-yellow-600 font-bold text-[8px] flex items-center justify-center">JJ</div>
                      <span className="font-bold">Jorge Jirafa</span>
                    </div>
                    <span className="text-slate-400">settled up</span>
                  </div>
                  {/* Friend 4 */}
                  <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-100">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold text-[8px] flex items-center justify-center">OF</div>
                      <span className="font-bold">Oli Fant</span>
                    </div>
                    <span className="text-rose-500 font-bold">you owe ₹1,751.00</span>
                  </div>
                  {/* Friend 5 */}
                  <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-100">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-bold text-[8px] flex items-center justify-center">ST</div>
                      <span className="font-bold">Stompy</span>
                    </div>
                    <span className="text-teal-600 font-bold">owes you ₹8,728.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Box: Organize Expenses (Teal) */}
            <div className="bg-[#1CC29F] text-white p-10 flex flex-col justify-between items-center text-center">
              <div className="max-w-md mb-8">
                <h3 className="text-2xl font-black">Organize expenses</h3>
                <p className="text-teal-100 mt-2 text-sm leading-relaxed">
                  Split expenses with any group: trips, housemates, friends, and family.
                </p>
              </div>

              {/* Phone Mockup */}
              <div className="relative border-[8px] border-teal-950 rounded-[32px] w-[250px] h-[400px] bg-[#f7f8f9] overflow-hidden shadow-2xl text-slate-800 flex flex-col">
                {/* Header status bar */}
                <div className="bg-teal-950 text-white h-5 px-3 flex justify-between items-center text-[9px] font-mono select-none">
                  <span>2:37</span>
                  <Smartphone className="w-2.5 h-2.5" />
                </div>
                {/* Navbar */}
                <div className="p-2 bg-[#1CC29F] text-white flex items-center justify-between">
                  <span className="text-[10px] font-bold">Back</span>
                  <span className="font-black text-xs truncate">Elle & Earl</span>
                  <span className="w-4" />
                </div>
                {/* Balance Header card */}
                <div className="bg-white p-3 border-b border-slate-100 text-left">
                  <div className="text-[8px] text-slate-400 font-bold">Group balance</div>
                  <div className="text-xs font-black text-teal-600">Earl E. owes you ₹6,770.00</div>
                  <div className="flex space-x-1.5 mt-2">
                    <button className="text-[7px] bg-[#1CC29F] text-white font-extrabold px-2 py-0.5 rounded">Settle up</button>
                    <button className="text-[7px] bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded">Balances</button>
                    <button className="text-[7px] bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded">Totals</button>
                  </div>
                </div>
                {/* Ledger */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-left text-[9px]">
                  <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">March 2021</div>
                  {/* Ledger Item 1 */}
                  <div className="bg-white p-2 rounded border border-slate-100 flex justify-between items-center">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-5 h-5 bg-teal-50/50 rounded flex items-center justify-center text-teal-600">🍪</div>
                      <div>
                        <div className="font-bold">Ellie's bakery</div>
                        <div className="text-[7px] text-slate-400">Earl E. paid ₹10,272.00</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[7px] text-slate-400">you borrowed</div>
                      <div className="font-bold text-rose-500">₹5,136.00</div>
                    </div>
                  </div>
                  {/* Ledger Item 2 */}
                  <div className="bg-white p-2 rounded border border-slate-100 flex justify-between items-center">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-5 h-5 bg-teal-50/50 rounded flex items-center justify-center text-teal-600">⛽</div>
                      <div>
                        <div className="font-bold">Fuel up</div>
                        <div className="text-[7px] text-slate-400">You paid ₹4,806.00</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[7px] text-slate-400">you lent</div>
                      <div className="font-bold text-teal-600">₹2,403.00</div>
                    </div>
                  </div>
                  {/* Ledger Item 3 */}
                  <div className="bg-white p-2 rounded border border-slate-100 flex justify-between items-center">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-5 h-5 bg-teal-50/50 rounded flex items-center justify-center text-teal-600">🎬</div>
                      <div>
                        <div className="font-bold">Movie night</div>
                        <div className="text-[7px] text-slate-400">You paid ₹500.00</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[7px] text-slate-400">you lent</div>
                      <div className="font-bold text-teal-600">₹250.00</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- DUAL MOCKUPS SECTION 2: Add Expenses Easily & Pay Friends Back --- */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden rounded-[32px] shadow-xl">
            {/* Left Box: Add Expenses Easily (Orange) */}
            <div className="bg-[#FF652F] text-white p-10 flex flex-col justify-between items-center text-center">
              <div className="max-w-md mb-8">
                <h3 className="text-2xl font-black">Add expenses easily</h3>
                <p className="text-orange-100 mt-2 text-sm leading-relaxed">
                  Quickly add expenses on the go before you forget who paid.
                </p>
              </div>

              {/* Phone Mockup */}
              <div className="relative border-[8px] border-orange-950 rounded-[32px] w-[250px] h-[400px] bg-white overflow-hidden shadow-2xl text-slate-800 flex flex-col">
                {/* Header status bar */}
                <div className="bg-orange-950 text-white h-5 px-3 flex justify-between items-center text-[9px] font-mono select-none">
                  <span>2:33</span>
                  <Smartphone className="w-2.5 h-2.5" />
                </div>
                {/* Navbar */}
                <div className="p-2.5 bg-[#FF652F] text-white flex justify-between items-center">
                  <span className="text-[9px] font-bold">X</span>
                  <span className="font-bold text-[10px]">Add an expense</span>
                  <span className="text-[9px] font-bold">Save</span>
                </div>
                {/* With line */}
                <div className="p-2 border-b border-slate-100 text-left text-[9px] flex items-center space-x-1">
                  <span className="text-slate-400">With</span>
                  <span className="font-bold">you</span>
                  <span className="text-slate-400">and:</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold">All of Tuscany trip ❤️</span>
                </div>
                {/* Expense Details Input simulated */}
                <div className="p-4 flex flex-col items-center justify-center flex-1 space-y-3 bg-slate-50/40">
                  <div className="flex items-center space-x-2">
                    <span className="w-8 h-8 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center text-base">🚕</span>
                    <input 
                      type="text" 
                      readOnly 
                      value="Taxi"
                      className="border-b border-slate-350 outline-none font-bold text-xs w-28 bg-transparent pb-0.5" 
                    />
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm font-black text-slate-400">₹</span>
                    <input 
                      type="text" 
                      readOnly 
                      value="18.73"
                      className="border-b border-slate-350 outline-none font-black text-lg w-24 bg-transparent text-center pb-0.5 text-[#FF652F]" 
                    />
                  </div>
                  <div className="bg-white px-2 py-1 border border-slate-200 rounded-lg text-[7px] text-slate-500 shadow-sm font-semibold">
                    Paid by <span className="font-bold text-slate-800">you</span> and split <span className="font-bold text-slate-800">equally</span>
                  </div>
                  <div className="text-[7px] text-slate-400 italic">
                    (₹9.37/person)
                  </div>
                </div>
                {/* Numeric keypad grid */}
                <div className="bg-slate-100 p-1 grid grid-cols-3 gap-0.5 text-center font-bold text-[10px] select-none text-slate-700">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((k) => (
                    <div key={k} className="bg-white py-1.5 rounded active:bg-slate-50 cursor-pointer">{k}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Box: Pay Friends Back (Dark) */}
            <div className="bg-[#2E3134] text-white p-10 flex flex-col justify-between items-center text-center">
              <div className="max-w-md mb-8">
                <h3 className="text-2xl font-black">Pay friends back</h3>
                <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                  Settle up with a friend and record any cash or online payment.
                </p>
              </div>

              {/* Phone Mockup */}
              <div className="relative border-[8px] border-neutral-800 rounded-[32px] w-[250px] h-[400px] bg-white overflow-hidden shadow-2xl text-slate-800 flex flex-col">
                {/* Header status bar */}
                <div className="bg-neutral-900 text-white h-5 px-3 flex justify-between items-center text-[9px] font-mono select-none">
                  <span>2:42</span>
                  <Smartphone className="w-2.5 h-2.5" />
                </div>
                {/* Navbar */}
                <div className="p-2.5 bg-neutral-800 text-white flex justify-between items-center">
                  <span className="text-[9px] font-bold">Back</span>
                  <span className="font-bold text-[10px]">Settle up</span>
                  <span className="text-[9px] font-bold">Save</span>
                </div>
                {/* Avatars connection */}
                <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 font-extrabold flex items-center justify-center text-xs shadow-md">EP</div>
                    <span className="text-slate-400 text-base">➔</span>
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-extrabold flex items-center justify-center text-xs shadow-md">OF</div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-600">You paid <span className="font-black text-slate-800">Earl E.</span></div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm font-black text-slate-400">₹</span>
                    <input 
                      type="text" 
                      readOnly 
                      value="92.21"
                      className="border-b border-slate-300 font-black text-lg w-28 text-center pb-0.5 text-slate-800 bg-transparent outline-none" 
                    />
                  </div>
                </div>
                {/* Numeric keypad grid */}
                <div className="bg-slate-100 p-1 grid grid-cols-3 gap-0.5 text-center font-bold text-[10px] select-none text-slate-700">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((k) => (
                    <div key={k} className="bg-white py-1.5 rounded active:bg-slate-50 cursor-pointer">{k}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- PRO BANNER SECTION --- */}
        <section className="bg-gradient-to-r from-[#8656CD] to-[#7245B8] text-white py-16">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Pro copy */}
            <div className="space-y-6 max-w-xl text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                Get even more with PRO
              </h2>
              <p className="text-purple-100 text-base leading-relaxed font-medium">
                Get even more organized with receipt scanning, charts and graphs, currency conversion, and more!
              </p>
              <div>
                <button
                  onClick={() => {
                    setLoginError("");
                    setIsSignUp(true);
                    setShowAuthForm(true);
                  }}
                  className="bg-transparent border-2 border-white hover:bg-white hover:text-[#8656CD] text-white font-extrabold text-base px-8 py-3 rounded-xl transition duration-200 cursor-pointer"
                >
                  Sign up
                </button>
              </div>
            </div>

            {/* Pro Phone Mockup */}
            <div className="flex justify-center">
              <div className="relative border-[8px] border-neutral-800 rounded-[32px] w-[250px] h-[420px] bg-slate-50 overflow-hidden shadow-2xl text-slate-800 flex flex-col">
                {/* Header status bar */}
                <div className="bg-neutral-900 text-white h-5 px-3 flex justify-between items-center text-[9px] font-mono select-none">
                  <span>2:42</span>
                  <Smartphone className="w-2.5 h-2.5" />
                </div>
                {/* Navbar */}
                <div className="p-2 bg-[#1CC29F] text-white flex justify-between items-center">
                  <span className="text-[9px] font-bold">Back</span>
                  <span className="font-bold text-[10px]">Details</span>
                  <div className="flex space-x-1">
                    <span className="text-[9px]">🗑️</span>
                    <span className="text-[9px]">✏️</span>
                  </div>
                </div>
                {/* Detail Card Header */}
                <div className="p-3 bg-white border-b border-slate-100 flex items-start space-x-2.5 text-left select-none">
                  <div className="text-xl bg-slate-50 w-8 h-8 rounded flex items-center justify-center border border-slate-100">🍪</div>
                  <div className="flex-1">
                    <div className="font-bold text-[10px] text-slate-800">Ellie's Bakery</div>
                    <div className="font-black text-xs text-slate-900">₹102.71</div>
                    <div className="text-[7px] text-slate-400 mt-0.5">Added by you on July 1, 2019</div>
                  </div>
                </div>
                {/* Splitting Details List */}
                <div className="p-3 bg-white border-b border-slate-100 text-left text-[8px] space-y-1.5">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-4 h-4 bg-pink-100 rounded-full flex items-center justify-center font-bold text-[7px]">EP</div>
                    <div>You paid <span className="font-bold">₹102.71</span></div>
                  </div>
                  <div className="pl-5 border-l border-slate-200 ml-2 space-y-1 text-slate-500 font-semibold">
                    <div>You owe ₹30.09</div>
                    <div>Earl E. owes ₹41.08</div>
                    <div>Stompy owes ₹31.54</div>
                  </div>
                </div>
                {/* Spending by category chart mockup */}
                <div className="p-3 bg-slate-100/50 text-left flex-1 select-none">
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">Spending by category</div>
                  <div className="mt-2 space-y-1 text-[8px]">
                    <div className="font-bold text-slate-700">Home Sweet Home :: Dining out</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-slate-400 text-[6px]">May</span>
                      <div className="h-2 w-2 bg-slate-200 rounded"></div>
                      <span className="text-slate-400 text-[6px]">₹0.00</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 text-[6px]">June</span>
                      <div className="h-2 w-24 bg-[#1CC29F] rounded"></div>
                      <span className="text-slate-700 font-bold text-[6px]">₹102.71</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 text-[6px]">July</span>
                      <div className="h-2 w-2 bg-slate-200 rounded"></div>
                      <span className="text-slate-400 text-[6px]">₹0.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- FEATURES SECTION: The Whole Nine Yards --- */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">The whole nine yards</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-base font-semibold text-slate-700">
              {/* Core features column */}
              <div className="space-y-4">
                <div className="text-xs font-extrabold text-teal-600 uppercase tracking-widest border-b border-slate-100 pb-2">Core Features</div>
                {[
                  "Add groups and friends",
                  "Split expenses, record debts",
                  "Equal or unequal splits",
                  "Split by % or shares",
                  "Calculate total balances",
                  "Simplify debts (Greedy algorithm)",
                  "Relational SQLite storage",
                  "Offline local DB sync"
                ].map((feat) => (
                  <div key={feat} className="flex items-center space-x-2">
                    <span className="text-xs text-[#1CC29F]">◆</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Pro features column */}
              <div className="space-y-4">
                <div className="text-xs font-extrabold text-purple-600 uppercase tracking-widest border-b border-slate-100 pb-2">Pro features</div>
                {[
                  "Unlimited expenses",
                  "Transaction logging",
                  "Expense short-polling chat",
                  "Details spending ledger",
                  "Real-time comments history",
                  "Secure passwordless credentials",
                  "Faceted responsive themes",
                  "Ad-free elegant dashboard"
                ].map((feat) => (
                  <div key={feat} className="flex items-center space-x-2">
                    <span className="text-xs text-purple-500">◆</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- TESTIMONIALS SECTION --- */}
        <section className="py-20 bg-slate-50 border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6 space-y-12">
            <h2 className="text-3xl font-black text-center text-slate-900">Loved by users and press</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote: "“Fundamental” for tracking finances. As good as WhatsApp for containing awkwardness.",
                  author: "Financial Times"
                },
                {
                  quote: "Life hack for group trips. Amazing tool to use when traveling with friends! Makes life so easy!!",
                  author: "Ahah S, iOS reviewer"
                },
                {
                  quote: "Makes it easy to split everything from your dinner bill to rent.",
                  author: "NY Times"
                },
                {
                  quote: "So amazing to have this app manage balances and help keep money out of relationships. love it!",
                  author: "Haseena C, Android"
                },
                {
                  quote: "I never fight with roommates over bills because of this genius expense-splitting app.",
                  author: "Business Insider"
                },
                {
                  quote: "I use it everyday. I use it for trips, roommates, loans. I love splitify.",
                  author: "Trickseyus, iOS reviewer"
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between space-y-4 hover:shadow-md transition">
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.quote}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold tracking-wide">
                    <span>{item.author}</span>
                    <span className="text-teal-400 text-lg">”</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- FOOTER SECTION & MOUNTAIN GRAPHIC --- */}
        <footer className="bg-white border-t border-slate-100 pt-16 flex-shrink-0 relative">
          <div className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-4 gap-8 z-10 relative">
            <div>
              <h4 className="font-bold text-sm text-slate-800 uppercase tracking-widest mb-4">Splitify</h4>
              <ul className="space-y-2 text-sm text-slate-500 font-semibold">
                <li><span className="hover:text-teal-500 cursor-pointer">About</span></li>
                <li><span className="hover:text-teal-500 cursor-pointer">Press</span></li>
                <li><span className="hover:text-teal-500 cursor-pointer">Blog</span></li>
                <li><span className="hover:text-teal-500 cursor-pointer">Jobs</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#FF652F] uppercase tracking-widest mb-4">Account</h4>
              <ul className="space-y-2 text-sm text-slate-500 font-semibold">
                <li><span onClick={() => { setLoginError(""); setIsSignUp(false); setShowAuthForm(true); }} className="hover:text-teal-500 cursor-pointer">Log in</span></li>
                <li><span onClick={() => { setLoginError(""); setIsSignUp(true); setShowAuthForm(true); }} className="hover:text-teal-500 cursor-pointer">Sign up</span></li>
                <li><span className="hover:text-teal-500 cursor-pointer">Reset password</span></li>
                <li><span className="hover:text-teal-500 cursor-pointer">Settings</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800 uppercase tracking-widest mb-4">More</h4>
              <ul className="space-y-2 text-sm text-slate-500 font-semibold">
                <li><span className="hover:text-teal-500 cursor-pointer">Contact us</span></li>
                <li><span className="hover:text-teal-500 cursor-pointer">FAQ</span></li>
                <li><span className="hover:text-teal-500 cursor-pointer">Site status</span></li>
                <li><span className="hover:text-teal-500 cursor-pointer">Terms of Service</span></li>
              </ul>
            </div>
            <div className="flex flex-col space-y-3 items-center md:items-end">
              <div className="bg-black text-white px-3 py-1.5 rounded-lg flex items-center space-x-2 w-36 cursor-pointer hover:bg-neutral-900 transition">
                <Apple className="w-5 h-5" />
                <div className="text-left select-none">
                  <div className="text-[6px] uppercase font-bold text-slate-400">Download on the</div>
                  <div className="text-xs font-black -mt-0.5 leading-tight">App Store</div>
                </div>
              </div>
              <div className="bg-black text-white px-3 py-1.5 rounded-lg flex items-center space-x-2 w-36 cursor-pointer hover:bg-neutral-900 transition">
                {/* Android vector icon path */}
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM11.1 5.6a.49.49 0 0 1-.8-.4l-.6-1a.5.5 0 1 1 .86-.5l.6 1a.49.49 0 0 1-.06.9zM13.7 5.6a.49.49 0 0 1-.06-.9l.6-1a.5.5 0 1 1 .86.5l-.6 1a.49.49 0 0 1-.8.4zM12 2C7.58 2 4 5.58 4 10h16c0-4.42-3.58-8-8-8z" />
                </svg>
                <div className="text-left select-none">
                  <div className="text-[6px] uppercase font-bold text-slate-400">Get it on</div>
                  <div className="text-xs font-black -mt-0.5 leading-tight">Google Play</div>
                </div>
              </div>
              <div className="text-[9px] text-slate-400 font-semibold mt-4">Made with :) by Vivek</div>
            </div>
          </div>

          {/* Overlapping Triangle Mountains Graphic Footer */}
          <div className="w-full absolute bottom-0 left-0 right-0 h-24 overflow-hidden pointer-events-none select-none z-0">
            <svg 
              className="w-full h-full" 
              viewBox="0 0 1200 100" 
              preserveAspectRatio="none" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Row of triangle mountain layers matching original layout */}
              <polygon points="0,100 120,20 240,100" fill="#2E3134" opacity="0.9" />
              <polygon points="150,100 270,30 390,100" fill="#1CC29F" opacity="0.85" />
              <polygon points="300,100 420,15 540,100" fill="#FF652F" opacity="0.9" />
              <polygon points="450,100 580,35 710,100" fill="#2E3134" opacity="0.95" />
              <polygon points="620,100 740,25 860,100" fill="#8656CD" opacity="0.8" />
              <polygon points="780,100 900,10 1020,100" fill="#1CC29F" opacity="0.9" />
              <polygon points="930,100 1050,40 1170,100" fill="#A6002F" opacity="0.85" />
              <polygon points="1060,100 1180,20 1300,100" fill="#2E3134" opacity="0.9" />
            </svg>
          </div>
        </footer>

        {/* --- GLASSMORPHISM CREDENTIALS MODAL OVERLAY --- */}
        {showAuthForm && (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 relative transition-all animate-float">
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowAuthForm(false);
                  setLoginName("");
                  setLoginEmail("");
                  setLoginPassword("");
                  setLoginError("");
                }}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8">
                <div className="inline-flex justify-center items-center w-14 h-14 bg-teal-500/10 text-teal-400 rounded-2xl mb-4 border border-teal-500/20 shadow-inner">
                  <IndianRupee className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-teal-200 to-emerald-400">
                  {isSignUp ? "Sign Up for Splitify" : "Log In to Splitify"}
                </h2>
                <p className="mt-2 text-slate-400 text-sm">
                  {isSignUp ? "Create a credentials account." : "Access your shared expenses."}
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-5">
                {isSignUp && (
                  <div>
                    <label htmlFor="loginName" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Your Full Name
                    </label>
                    <input
                      id="loginName"
                      type="text"
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="loginEmail" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Your Email Address
                  </label>
                  <input
                    id="loginEmail"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  />
                </div>

                <div>
                  <label htmlFor="loginPassword" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Your Password
                  </label>
                  <input
                    id="loginPassword"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  />
                </div>

                {loginError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3 text-center">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition-all duration-250 active:scale-98 shadow-[0_0_15px_rgba(20,184,166,0.3)] cursor-pointer"
                >
                  {isSignUp ? "Sign Up" : "Log In"}
                </button>

                <p className="text-slate-400 text-xs text-center mt-4">
                  {isSignUp ? (
                    <>
                      Already have an account?{" "}
                      <span
                        onClick={() => {
                          setIsSignUp(false);
                          setLoginError("");
                          setLoginName("");
                          setLoginEmail("");
                          setLoginPassword("");
                        }}
                        className="text-teal-400 hover:underline cursor-pointer font-bold"
                      >
                        Log In
                      </span>
                    </>
                  ) : (
                    <>
                      Don't have an account?{" "}
                      <span
                        onClick={() => {
                          setIsSignUp(true);
                          setLoginError("");
                          setLoginName("");
                          setLoginEmail("");
                          setLoginPassword("");
                        }}
                        className="text-teal-400 hover:underline cursor-pointer font-bold"
                      >
                        Sign Up
                      </span>
                    </>
                  )}
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Calculate global summary (overall balance) from all groups
  // We can sum the net balance of currentUser in all group details we have access to
  // For demo, we compute this dynamically on the client by scanning groupDe  // --- CALCULATE GLOBAL BALANCES FROM ALL GROUPS ---
  let globalNetBalance = 0;
  let globalYouOwe = 0;
  let globalYouAreOwed = 0;

  const peopleYouOweMap: Record<string, { id: string; name: string; email: string; amount: number }> = {};
  const peopleWhoOweYouMap: Record<string, { id: string; name: string; email: string; amount: number }> = {};

  allGroupsDetails.forEach((gDet) => {
    // Net balance
    const userBalanceObj = gDet.balances.find((b) => b.id === currentUser.id);
    if (userBalanceObj) {
      globalNetBalance += userBalanceObj.netBalance;
    }
    // Debt breakdown
    gDet.simplifiedDebts.forEach((debt) => {
      if (debt.fromUser.id === currentUser.id) {
        globalYouOwe += debt.amount;
        const creditor = debt.toUser;
        if (!peopleYouOweMap[creditor.id]) {
          peopleYouOweMap[creditor.id] = { id: creditor.id, name: creditor.name, email: creditor.email, amount: 0 };
        }
        peopleYouOweMap[creditor.id].amount += debt.amount;
      }
      if (debt.toUser.id === currentUser.id) {
        globalYouAreOwed += debt.amount;
        const debtor = debt.fromUser;
        if (!peopleWhoOweYouMap[debtor.id]) {
          peopleWhoOweYouMap[debtor.id] = { id: debtor.id, name: debtor.name, email: debtor.email, amount: 0 };
        }
        peopleWhoOweYouMap[debtor.id].amount += debt.amount;
      }
    });
  });

  const peopleYouOwe = Object.values(peopleYouOweMap);
  const peopleWhoOweYou = Object.values(peopleWhoOweYouMap);

  const getAvatarInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const code = name.charCodeAt(0) % 5;
    const colors = [
      "bg-emerald-100 text-emerald-700 border-emerald-200",
      "bg-purple-100 text-purple-700 border-purple-200",
      "bg-pink-100 text-pink-700 border-pink-200",
      "bg-orange-100 text-orange-700 border-orange-200",
      "bg-blue-100 text-blue-700 border-blue-200",
    ];
    return colors[code];
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans select-none overflow-hidden">
      {/* --- TOP HEADER BAR --- */}
      <header className="bg-[#1CC29F] text-white px-6 h-14 flex items-center justify-between shadow-md z-30 select-none flex-shrink-0">
        <div className="flex items-center space-x-2">
          {/* logo */}
          <svg className="w-6 h-6" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="50,15 15,75 50,60" fill="#FFF" opacity="0.9" />
            <polygon points="50,15 85,75 50,60" fill="#EEE" opacity="0.8" />
            <polygon points="15,75 85,75 50,60" fill="#DDD" opacity="0.75" />
          </svg>
          <span className="font-black text-lg tracking-tight">Splitify</span>
        </div>

        {/* User profile actions */}
        <div className="flex items-center space-x-4">
          <span className="font-bold text-sm text-teal-50">Hello, {currentUser.name}!</span>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 hover:bg-teal-600/50 rounded-lg text-teal-100 hover:text-white transition cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* --- MAIN WORKSPACE WORKAREA --- */}
      <div className="flex-1 flex overflow-hidden">
        {/* --- LEFT SIDEBAR PANEL --- */}
        <aside className="w-64 bg-[#F6F6F6] border-r border-[#D5D5D5] flex flex-col justify-between py-4 select-none flex-shrink-0">
          <div>
            {/* Nav tabs */}
            <div className="px-2 space-y-0.5">
              <button
                onClick={() => setActiveGroupId(null)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-sm font-semibold rounded-lg transition cursor-pointer ${
                  activeGroupId === null
                    ? "bg-[#EFEFEF] border-l-4 border-[#1CC29F] pl-2 text-slate-900 font-extrabold"
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                }`}
              >
                <Activity className="w-4 h-4 text-slate-400" />
                <span>Dashboard</span>
              </button>
            </div>

            {/* Groups Header block */}
            <div className="px-4 py-3 flex justify-between items-center mt-5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Groups</span>
              <button
                onClick={() => setCreateGroupOpen(true)}
                title="Create Group"
                className="p-1 text-[#1CC29F] hover:bg-slate-200 rounded transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* inline creation form */}
            {createGroupOpen && (
              <form onSubmit={handleCreateGroup} className="mx-3 p-2.5 bg-white border border-slate-200 rounded-lg space-y-2 mb-2">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group Name (e.g. Tuscany)"
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1CC29F]"
                  autoFocus
                />
                <div className="flex space-x-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setCreateGroupOpen(false)}
                    className="px-2 py-0.5 text-[9px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-0.5 text-[9px] font-bold bg-[#1CC29F] text-white rounded hover:brightness-105 cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            {/* Groups list */}
            <div className="px-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-280px)]">
              {groupsLoading ? (
                <div className="text-center py-4 text-xs text-slate-400">Loading...</div>
              ) : groups.length === 0 ? (
                <div className="text-center py-6 px-3 text-[10px] text-slate-400 leading-relaxed italic">
                  No groups yet. Click + to create one!
                </div>
              ) : (
                groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setActiveGroupId(g.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition cursor-pointer ${
                      activeGroupId === g.id
                        ? "bg-white border-l-4 border-[#1CC29F] pl-2 text-slate-900 font-extrabold shadow-sm"
                        : "text-slate-650 hover:bg-slate-200/50 hover:text-slate-900"
                    }`}
                  >
                    <div className="w-5 h-5 bg-slate-200 text-slate-500 rounded font-black text-[9px] flex items-center justify-center flex-shrink-0">
                      {g.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold truncate">{g.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* credits info footer */}
          <div className="px-4 text-[9px] text-slate-400 font-semibold select-none">
            Relational DB Engine (SQLite)
          </div>
        </aside>

        {/* --- MAIN CONTENT PANEL --- */}
        <main className="flex-1 bg-white flex flex-col overflow-hidden relative">
          {groupLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-30 flex items-center justify-center">
              <Loader2 className="w-9 h-9 text-[#1CC29F] animate-spin" />
            </div>
          )}

          {!activeGroupId ? (
            /* =========================================
               GLOBAL DASHBOARD PAGE
               ========================================= */
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Header Bar */}
              <div className="px-6 py-4 bg-[#EEEEEE] border-b border-[#D5D5D5] flex justify-between items-center">
                <h1 className="text-lg font-black text-slate-800">Dashboard</h1>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSettleUpOpen(true)}
                    className="bg-[#5BC5A7] hover:brightness-105 text-white font-extrabold text-xs px-3.5 py-1.5 rounded shadow-sm transition active:scale-97 cursor-pointer"
                  >
                    Settle up
                  </button>
                </div>
              </div>

              {/* Three column Balance Summary Card */}
              <div className="mx-6 mt-6 border border-[#D5D5D5] rounded-lg bg-[#F6F6F6] grid grid-cols-3 divide-x divide-[#D5D5D5] text-center select-none shadow-xs">
                <div className="py-3">
                  <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">total balance</div>
                  <div className={`font-black text-sm mt-0.5 ${
                    globalNetBalance > 0.005
                      ? "text-[#5BC5A7]"
                      : globalNetBalance < -0.005
                      ? "text-[#FF652F]"
                      : "text-slate-500"
                  }`}>
                    {globalNetBalance > 0.005 ? `+₹${globalNetBalance.toFixed(2)}` : globalNetBalance < -0.005 ? `-₹${Math.abs(globalNetBalance).toFixed(2)}` : "₹0.00"}
                  </div>
                </div>
                <div className="py-3">
                  <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">you owe</div>
                  <div className={`font-black text-sm mt-0.5 ${globalYouOwe > 0.005 ? "text-[#FF652F]" : "text-slate-500"}`}>
                    ₹{globalYouOwe.toFixed(2)}
                  </div>
                </div>
                <div className="py-3">
                  <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">you are owed</div>
                  <div className={`font-black text-sm mt-0.5 ${globalYouAreOwed > 0.005 ? "text-[#5BC5A7]" : "text-slate-500"}`}>
                    ₹{globalYouAreOwed.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Debts Columns details row */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: You owe list */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">You Owe</h3>
                  {peopleYouOwe.length === 0 ? (
                    <p className="text-xs text-slate-450 italic py-4">You do not owe anyone anything!</p>
                  ) : (
                    <div className="space-y-3">
                      {peopleYouOwe.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition border border-transparent hover:border-slate-100">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs ${getAvatarColor(item.name)}`}>
                              {getAvatarInitials(item.name)}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-slate-800">{item.name}</div>
                              <div className="text-[10px] text-slate-400">{item.email}</div>
                            </div>
                          </div>
                          <span className="text-rose-500 font-black text-xs">you owe ₹{item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: You are owed list */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">You Are Owed</h3>
                  {peopleWhoOweYou.length === 0 ? (
                    <p className="text-xs text-slate-450 italic py-4">No one owes you money currently.</p>
                  ) : (
                    <div className="space-y-3">
                      {peopleWhoOweYou.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition border border-transparent hover:border-slate-100">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs ${getAvatarColor(item.name)}`}>
                              {getAvatarInitials(item.name)}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-slate-800">{item.name}</div>
                              <div className="text-[10px] text-slate-400">{item.email}</div>
                            </div>
                          </div>
                          <span className="text-emerald-500 font-black text-xs">{item.name} owes you ₹{item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : !groupDetails ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <p>Failed to load group details.</p>
            </div>
          ) : (
            /* =========================================
               GROUP DASHBOARD VIEW (Active Group)
               ========================================= */
            <div className="flex-1 flex overflow-hidden">
              {/* Group center feed column */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Group Header Bar */}
                <div className="px-6 py-4 bg-[#EEEEEE] border-b border-[#D5D5D5] flex justify-between items-center flex-shrink-0">
                  <div>
                    <h1 className="text-lg font-black text-slate-800">{groupDetails.group.name}</h1>
                    <p className="text-[10px] text-slate-450 mt-0.5">
                      {groupDetails.group.members?.length || 0} members split bills here
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setImportCSVOpen(true)}
                      className="bg-[#1CC29F] hover:brightness-105 text-white font-extrabold text-xs px-3.5 py-1.5 rounded shadow-sm transition active:scale-97 cursor-pointer"
                    >
                      Import CSV
                    </button>
                    <button
                      onClick={() => setSettleUpOpen(true)}
                      className="bg-[#5BC5A7] hover:brightness-105 text-white font-extrabold text-xs px-3.5 py-1.5 rounded shadow-sm transition active:scale-97 cursor-pointer"
                    >
                      Settle up
                    </button>
                    <button
                      onClick={() => setAddExpenseOpen(true)}
                      className="bg-[#FF652F] hover:brightness-105 text-white font-extrabold text-xs px-3.5 py-1.5 rounded shadow-sm transition active:scale-97 cursor-pointer"
                    >
                      Add Expense
                    </button>
                  </div>
                </div>

                {/* Group Summary balances card */}
                {(() => {
                  const currentGroupBal = groupDetails.balances.find((b) => b.id === currentUser.id);
                  const netVal = currentGroupBal ? currentGroupBal.netBalance : 0;
                  // Owe / Owed breakdowns within this group
                  let oweVal = 0;
                  let owedVal = 0;
                  groupDetails.simplifiedDebts.forEach((debt) => {
                    if (debt.fromUser.id === currentUser.id) oweVal += debt.amount;
                    if (debt.toUser.id === currentUser.id) owedVal += debt.amount;
                  });

                  return (
                    <div className="mx-6 mt-6 border border-[#D5D5D5] rounded-lg bg-[#F6F6F6] grid grid-cols-3 divide-x divide-[#D5D5D5] text-center select-none shadow-xs">
                      <div className="py-2.5">
                        <div className="text-[9px] text-slate-400 font-extrabold uppercase">your balance</div>
                        <div className={`font-black text-xs mt-0.5 ${
                          netVal > 0.005
                            ? "text-[#5BC5A7]"
                            : netVal < -0.005
                            ? "text-[#FF652F]"
                            : "text-slate-500"
                        }`}>
                          {netVal > 0.005 ? `+₹${netVal.toFixed(2)}` : netVal < -0.005 ? `-₹${Math.abs(netVal).toFixed(2)}` : "₹0.00"}
                        </div>
                      </div>
                      <div className="py-2.5">
                        <div className="text-[9px] text-slate-400 font-extrabold uppercase">you owe</div>
                        <div className={`font-black text-xs mt-0.5 ${oweVal > 0.005 ? "text-[#FF652F]" : "text-slate-500"}`}>
                          ₹{oweVal.toFixed(2)}
                        </div>
                      </div>
                      <div className="py-2.5">
                        <div className="text-[9px] text-slate-400 font-extrabold uppercase">you are owed</div>
                        <div className={`font-black text-xs mt-0.5 ${owedVal > 0.005 ? "text-[#5BC5A7]" : "text-slate-500"}`}>
                          ₹{owedVal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Ledger ledger list scroll */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center space-x-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#1CC29F]" />
                    <span>Activity Ledger</span>
                  </h3>

                  {groupDetails.group.expenses.length === 0 && groupDetails.group.payments.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-xl p-10 text-center text-xs text-slate-400 select-none">
                      No expenses or payments recorded yet. Record some transactions above!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                      {[
                        ...groupDetails.group.expenses.map((e) => ({ ...e, type: "EXPENSE" as const })),
                        ...groupDetails.group.payments.map((p) => ({ ...p, type: "PAYMENT" as const })),
                      ]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((item) => {
                          const dateObj = new Date(item.createdAt);
                          const monthAbbr = dateObj.toLocaleString("en-US", { month: "short" }).toUpperCase();
                          const dayNum = dateObj.getDate();

                          if (item.type === "EXPENSE") {
                            const exp = item as Expense;
                            // Calculate your splits details
                            const userSplit = exp.splits.find((s) => s.userId === currentUser.id);
                            const userSplitAmount = userSplit ? userSplit.amount : 0;
                            const wasPayer = exp.paidById === currentUser.id;

                            let lentAmount = 0;
                            let borrowedAmount = 0;
                            if (wasPayer) {
                              lentAmount = exp.amount - userSplitAmount;
                            } else if (userSplit) {
                              borrowedAmount = userSplitAmount;
                            }

                            return (
                              <div
                                key={exp.id}
                                onClick={() => setActiveExpenseChat(exp)}
                                className="p-3.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition select-none"
                              >
                                <div className="flex items-center space-x-3.5 min-w-0">
                                  {/* Splitwise date card column */}
                                  <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-center w-11 flex-shrink-0">
                                    <span className="text-[8px] font-bold text-slate-400 leading-none">{monthAbbr}</span>
                                    <span className="text-sm font-black text-slate-700 leading-tight mt-0.5">{dayNum}</span>
                                  </div>

                                  <div className="min-w-0">
                                    <h4 className="font-bold text-xs text-slate-800 truncate">{exp.description}</h4>
                                    <p className="text-[9px] text-slate-450 mt-0.5">
                                      paid by <span className="font-semibold text-slate-600">{wasPayer ? "you" : exp.paidBy.name}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right flex-shrink-0 ml-4 flex items-center space-x-3.5">
                                  <div>
                                    {lentAmount > 0.005 ? (
                                      <>
                                        <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">you lent</div>
                                        <div className="font-black text-xs text-[#5BC5A7]">₹{lentAmount.toFixed(2)}</div>
                                      </>
                                    ) : borrowedAmount > 0.005 ? (
                                      <>
                                        <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">you borrowed</div>
                                        <div className="font-black text-xs text-[#FF652F]">₹{borrowedAmount.toFixed(2)}</div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">not involved</div>
                                        <div className="font-bold text-xs text-slate-400">₹0.00</div>
                                      </>
                                    )}
                                    <div className="text-[8px] text-slate-400 mt-0.5">total: ₹{exp.amount.toFixed(2)}</div>
                                  </div>
                                  <MessageCircle className="w-4 h-4 text-slate-300 hover:text-[#1CC29F] transition" />
                                </div>
                              </div>
                            );
                          } else {
                            const pay = item as Payment;
                            const isPayer = pay.fromUserId === currentUser.id;
                            const isReceiver = pay.toUserId === currentUser.id;

                            return (
                              <div
                                key={pay.id}
                                className="p-3.5 bg-slate-50/40 flex items-center justify-between border-l-4 border-dashed border-emerald-400/60 select-none text-[10px]"
                              >
                                <div className="flex items-center space-x-3 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                                    <CheckCircle className="w-4.5 h-4.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-slate-650">
                                      <span className="font-black text-slate-800">{pay.fromUser.name}</span> settled up with{" "}
                                      <span className="font-black text-slate-800">{pay.toUser.name}</span>
                                    </div>
                                    <div className="text-[8px] text-slate-400 mt-0.5">{dateObj.toLocaleDateString()}</div>
                                  </div>
                                </div>
                                <div className="font-black text-xs text-emerald-600">
                                  ₹{pay.amount.toFixed(2)}
                                </div>
                              </div>
                            );
                          }
                        })}
                    </div>
                  )}
                </div>
              </div>

              {/* Group sidebar panel (members, debts) */}
              <aside className="w-72 border-l border-slate-200 bg-slate-50/50 p-5 space-y-6 overflow-y-auto flex-shrink-0">
                {/* Members list */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-[#1CC29F]" />
                    <span>Members</span>
                  </h3>

                  {/* Add member form */}
                  <form onSubmit={handleAddMember} className="space-y-1.5">
                    <input
                      type="email"
                      value={addMemberEmail}
                      onChange={(e) => setAddMemberEmail(e.target.value)}
                      placeholder="Add member by email..."
                      className="w-full bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1CC29F]"
                    />
                    <button
                      type="submit"
                      className="w-full bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-bold py-1.5 rounded-lg transition cursor-pointer"
                    >
                      Invite Friend
                    </button>
                  </form>

                  {memberMessage && (
                    <div className={`p-2 rounded text-[9px] leading-snug border ${
                      memberMessage.isError
                        ? "bg-rose-50 border-rose-100 text-rose-600"
                        : "bg-emerald-50 border-emerald-100 text-emerald-600"
                    }`}>
                      {memberMessage.text}
                    </div>
                  )}

                  {/* Members list */}
                  <div className="space-y-1.5 mt-2">
                    {groupDetails.balances.map((mb) => (
                      <div key={mb.id} className="flex justify-between items-center bg-white border border-slate-200 p-2 rounded-lg text-xs">
                        <div className="truncate pr-1">
                          <div className="font-bold text-slate-800 truncate">{mb.name}</div>
                          <div className="text-[8px] text-slate-400 truncate">{mb.email}</div>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <span className={`font-black text-[10px] ${
                            mb.netBalance > 0.005
                              ? "text-emerald-500"
                              : mb.netBalance < -0.005
                              ? "text-rose-500"
                              : "text-slate-400"
                          }`}>
                            {mb.netBalance > 0.005 ? `+₹${mb.netBalance.toFixed(2)}` : mb.netBalance < -0.005 ? `-₹${Math.abs(mb.netBalance).toFixed(2)}` : "₹0.00"}
                          </span>
                          <button
                            onClick={() => handleRemoveMember(mb.id)}
                            title="Remove member"
                            className="p-1 hover:text-red-500 rounded hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Debts list */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                    <CreditCard className="w-4 h-4 text-[#FF652F]" />
                    <span>Group Debts</span>
                  </h3>
                  {groupDetails.simplifiedDebts.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic py-2">All settled up here!</p>
                  ) : (
                    <div className="space-y-2">
                      {groupDetails.simplifiedDebts.map((d, i) => (
                        <div
                          key={i}
                          onClick={() => handleShowDebtBreakdown(d.fromUser, d.toUser, d.amount)}
                          className="bg-white border border-slate-200 hover:border-slate-400 p-2.5 rounded-lg text-[10px] space-y-1 cursor-pointer hover:bg-slate-50 transition shadow-xs group"
                          title="Click to view detailed itemized debt ledger breakdown"
                        >
                          <div className="flex justify-between items-center text-slate-650 font-medium">
                            <span className="font-bold text-slate-800 group-hover:text-[#1CC29F] transition">{d.fromUser.name}</span>
                            <span>owes</span>
                            <span className="font-bold text-slate-800 group-hover:text-[#1CC29F] transition">{d.toUser.name}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[8px] text-slate-450 italic font-semibold">Click to inspect breakdown</span>
                            <div className="text-right font-black text-xs text-rose-500">
                              ₹{d.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}
        </main>
      </div>

      {/* =========================================
         LIGHT THEME MODAL PANELS
         ========================================= */}

      {/* --- MODAL: ADD EXPENSE --- */}
      {addExpenseOpen && groupDetails && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto text-slate-800">
            <button
              onClick={() => setAddExpenseOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center space-x-2">
              <span className="p-1 bg-orange-100 text-[#FF652F] rounded-lg">🚕</span>
              <span>Add New Expense</span>
            </h2>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="e.g. Dinner on Friday"
                  className="w-full bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-950 placeholder-slate-400 focus:outline-none focus:border-[#1CC29F]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-950 placeholder-slate-400 focus:outline-none focus:border-[#1CC29F]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Paid By
                  </label>
                  <select
                    value={expensePayerId}
                    onChange={(e) => setExpensePayerId(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-2 text-slate-950 focus:outline-none focus:border-[#1CC29F]"
                  >
                    {groupDetails.group.members?.map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Split Type
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["EQUAL", "UNEQUAL", "PERCENTAGE", "SHARE"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setExpenseSplitType(type)}
                      className={`py-1.5 text-[9px] font-bold rounded-lg border transition cursor-pointer ${
                        expenseSplitType === type
                          ? "bg-teal-50 border-[#1CC29F] text-[#1CC29F]"
                          : "bg-white border-slate-200 text-slate-450 hover:bg-slate-55"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Split Breakdown
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                  {groupDetails.group.members?.map((m) => {
                    const uid = m.user.id;
                    const conf = expenseSplitsConfig[uid] || { selected: true, value: "" };
                    const splitAmt = getCalculatedSplitAmount(uid);

                    return (
                      <div key={uid} className="flex items-center justify-between text-xs select-none">
                        <div className="flex items-center space-x-2.5">
                          <input
                            type="checkbox"
                            checked={conf.selected}
                            onChange={(e) =>
                              setExpenseSplitsConfig({
                                ...expenseSplitsConfig,
                                [uid]: { ...conf, selected: e.target.checked },
                              })
                            }
                            className="w-4 h-4 rounded text-[#1CC29F] focus:ring-0 border-slate-300 cursor-pointer"
                          />
                          <span className="font-bold text-slate-650">{m.user.name}</span>
                        </div>

                        <div className="flex items-center space-x-3">
                          {expenseSplitType !== "EQUAL" && conf.selected && (
                            <input
                              type="number"
                              step="any"
                              value={conf.value}
                              onChange={(e) =>
                                setExpenseSplitsConfig({
                                  ...expenseSplitsConfig,
                                  [uid]: { ...conf, value: e.target.value },
                                })
                              }
                              placeholder={
                                expenseSplitType === "UNEQUAL"
                                  ? "₹0.00"
                                  : expenseSplitType === "PERCENTAGE"
                                  ? "0%"
                                  : "Shares"
                              }
                              className="w-18 bg-white border border-slate-200 text-center rounded py-0.5 px-1.5 text-xs focus:outline-none"
                              required
                            />
                          )}
                          <span className="text-[10px] text-slate-450 w-16 text-right font-black">
                            ₹{splitAmt.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {expenseError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg p-2.5 text-center font-semibold">
                  {expenseError}
                </div>
              )}

              <div className="flex space-x-2.5 justify-end mt-5 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setAddExpenseOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={expenseSubmitting}
                  className="flex items-center space-x-1.5 px-4.5 py-1.5 bg-[#FF652F] text-white disabled:opacity-55 text-xs font-bold rounded-lg transition hover:brightness-105 cursor-pointer"
                >
                  {expenseSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: SETTLE UP --- */}
      {settleUpOpen && groupDetails && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative text-slate-850">
            <button
              onClick={() => setSettleUpOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center space-x-2">
              <span className="p-1 bg-emerald-100 text-[#5BC5A7] rounded-lg">💳</span>
              <span>Record a Payment</span>
            </h2>

            <form onSubmit={handleSettleUp} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Who Paid? (Debtor)
                </label>
                <select
                  value={settleFromUserId}
                  onChange={(e) => setSettleFromUserId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none"
                  required
                >
                  <option value="">Select payer</option>
                  {groupDetails.group.members?.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Who Received? (Creditor)
                </label>
                <select
                  value={settleToUserId}
                  onChange={(e) => setSettleToUserId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none"
                  required
                >
                  <option value="">Select receiver</option>
                  {groupDetails.group.members?.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Amount Settled (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-950 focus:outline-none focus:border-[#1CC29F]"
                  required
                />
              </div>

              {settleError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg p-2.5 text-center font-semibold">
                  {settleError}
                </div>
              )}

              <div className="flex space-x-2.5 justify-end mt-5 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setSettleUpOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settleSubmitting}
                  className="flex items-center space-x-1.5 px-4.5 py-1.5 bg-[#5BC5A7] text-white disabled:opacity-55 text-xs font-bold rounded-lg transition hover:brightness-105 cursor-pointer"
                >
                  {settleSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: EXPENSE DETAIL & CHAT --- */}
      {activeExpenseChat && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[85vh] text-slate-800">
            {/* Left: Split Details */}
            <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-100 overflow-y-auto">
              <div className="flex justify-between items-start mb-5 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-black text-slate-900 leading-tight">{activeExpenseChat.description}</h2>
                  <p className="text-[10px] text-slate-450 mt-1">
                    paid by <span className="font-bold text-slate-600">{activeExpenseChat.paidBy.name}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-[#1CC29F]">₹{activeExpenseChat.amount.toFixed(2)}</div>
                  <span className="text-[8px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {activeExpenseChat.splitType}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Split Breakdown</h4>
                <div className="space-y-2">
                  {activeExpenseChat.splits.map((s) => (
                    <div key={s.id} className="flex justify-between items-center bg-slate-50 border border-slate-150 p-2.5 rounded-lg text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{s.user.name}</div>
                        {s.ratioVal !== null && s.ratioVal !== undefined && (
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            {activeExpenseChat.splitType === "PERCENTAGE" ? `${s.ratioVal}%` : `${s.ratioVal} shares`}
                          </div>
                        )}
                      </div>
                      <span className="font-black text-slate-850">₹{s.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Polling Chat */}
            <div className="w-full md:w-72 flex flex-col bg-slate-50/50 overflow-hidden min-h-[350px]">
              {/* Chat Header */}
              <div className="p-3.5 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                <div className="flex items-center space-x-1.5 text-[10px] font-black text-slate-500 tracking-wider uppercase">
                  <MessageSquare className="w-4 h-4 text-[#1CC29F]" />
                  <span>Expense Chat</span>
                </div>
                <button
                  onClick={() => setActiveExpenseChat(null)}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat messages list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatLoading && chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-4.5 h-4.5 text-[#1CC29F] animate-spin" />
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center p-3 select-none">
                    <MessageSquare className="w-7 h-7 text-slate-300 mb-1.5" />
                    <p className="text-[9px] text-slate-400 italic">No messages. Post an update!</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isOwn = msg.userId === currentUser.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                        <span className="text-[8px] text-slate-400 font-bold mb-0.5 px-0.5">{msg.user.name}</span>
                        <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${
                          isOwn
                            ? "bg-[#1CC29F] text-white font-semibold rounded-tr-none shadow-xs"
                            : "bg-white border border-slate-200 text-slate-850 rounded-tl-none shadow-2xs"
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChatMessage} className="p-2 border-t border-slate-150 bg-white flex-shrink-0 flex space-x-1.5">
                <input
                  type="text"
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1CC29F]"
                />
                <button
                  type="submit"
                  disabled={chatSubmitting || !newChatMessage.trim()}
                  className="p-1.5 bg-[#1CC29F] text-white disabled:opacity-45 rounded-lg hover:brightness-105 active:scale-95 transition flex-shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: CSV IMPORT WIZARD --- */}
      {importCSVOpen && groupDetails && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto text-slate-800">
            <button
              onClick={closeImportWizard}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center space-x-2">
              <span className="p-1 bg-teal-100 text-[#1CC29F] rounded-lg">📊</span>
              <span>CSV Expense Importer</span>
            </h2>

            {importStep === 1 && (
              <div className="space-y-6 py-4 text-center">
                <div className="max-w-md mx-auto border-2 border-dashed border-slate-200 rounded-xl p-8 hover:border-[#1CC29F] transition bg-slate-50/50">
                  <div className="w-12 h-12 bg-teal-50 text-[#1CC29F] rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-100">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">Upload expenses_export.csv</h3>
                  <p className="text-xs text-slate-450 mb-6 max-w-xs mx-auto leading-relaxed">
                    Select the unedited CSV spreadsheet to scan for shared flatmate expenses, payments, and data anomalies.
                  </p>
                  
                  <label className="inline-block bg-[#1CC29F] hover:brightness-105 text-white font-extrabold text-xs px-5 py-2.5 rounded-lg shadow-sm cursor-pointer transition active:scale-97 font-semibold">
                    <span>Choose CSV File</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {importLoading && (
                  <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 font-semibold animate-pulse">
                    <Loader2 className="w-4.5 h-4.5 text-[#1CC29F] animate-spin" />
                    <span>Parsing spreadsheet and identifying anomalies...</span>
                  </div>
                )}

                {importError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg p-3 max-w-md mx-auto font-semibold">
                    {importError}
                  </div>
                )}
              </div>
            )}

            {importStep === 2 && (
              <div className="space-y-6">
                {/* Introduction info */}
                <div className="bg-teal-50/50 border border-teal-100/50 rounded-xl p-4 flex items-start space-x-3 text-xs">
                  <span className="text-lg">ℹ️</span>
                  <div className="leading-relaxed">
                    <p className="font-bold text-teal-900">Spreadsheet Scan Complete</p>
                    <p className="text-teal-850 mt-0.5">
                      Found <strong>{importTotalRows}</strong> rows. We detected several data anomalies, including Priya's USD transactions, Sam & Meera timeline constraints, and settlements. Please resolve the duplicate conflicts below to confirm.
                    </p>
                  </div>
                </div>

                {/* Duplicates to resolve */}
                {importDuplicates.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5 border-b border-slate-150 pb-1.5">
                      <span>⚠️ Duplicate Resolver (Meera's Approval UI)</span>
                    </h3>
                    
                    <div className="space-y-4">
                      {importDuplicates.map((group, gIdx) => {
                        const siblingRowNums = group.rows.map((r: any) => r.rowNum);
                        
                        return (
                          <div key={gIdx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30 text-xs">
                            <div className="px-4 py-2 bg-slate-100 text-[10px] font-black text-slate-500 flex justify-between items-center border-b border-slate-200">
                              <span>
                                {group.type === "EXACT" 
                                  ? `EXACT DUPLICATES (Row ${siblingRowNums.join(", ")})` 
                                  : `CONFLICTING TRANSACTIONS (Same date/description, different amounts)`}
                              </span>
                              <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-[8px] font-bold">
                                {group.type === "EXACT" ? "Auto-Flagged" : "Action Required"}
                              </span>
                            </div>
                            
                            <div className="p-3 divide-y divide-slate-150">
                              {group.rows.map((row: any) => {
                                const isSelected = duplicateResolutions[row.rowNum] === "KEEP";
                                const isRejected = duplicateResolutions[row.rowNum] === "DELETE";
                                
                                return (
                                  <div key={row.rowNum} className={`py-3 flex flex-col md:flex-row justify-between items-start md:items-center first:pt-0 last:pb-0 ${isSelected ? "bg-emerald-50/20" : isRejected ? "bg-rose-50/10 opacity-60" : ""}`}>
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[9px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded">Row {row.rowNum}</span>
                                        <span className="font-bold text-xs text-slate-800">{row.description}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-550 flex flex-wrap gap-x-4">
                                        <span>Date: <strong>{new Date(row.date).toLocaleDateString()}</strong></span>
                                        <span>Paid By: <strong>{row.payerName}</strong></span>
                                        <span>Split: <strong>{row.participants.map((p: any) => p.name).join(", ")}</strong></span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4 mt-2 md:mt-0 flex-shrink-0">
                                      <div className="text-right">
                                        <span className="font-black text-sm text-slate-800 font-bold">₹{row.amount.toFixed(2)}</span>
                                      </div>
                                      
                                      <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 text-[10px] font-bold shadow-2xs">
                                        <button
                                          type="button"
                                          onClick={() => handleResolveDuplicate(row.rowNum, "KEEP", siblingRowNums.filter((n: number) => n !== row.rowNum))}
                                          className={`px-3 py-1 rounded transition cursor-pointer ${isSelected ? "bg-emerald-500 text-white shadow-2xs" : "text-slate-650 hover:bg-slate-100"}`}
                                        >
                                          Keep
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleResolveDuplicate(row.rowNum, "DELETE", [])}
                                          className={`px-3 py-1 rounded transition cursor-pointer ${isRejected ? "bg-rose-500 text-white shadow-2xs" : "text-slate-655 hover:bg-slate-100"}`}
                                        >
                                          Discard
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Other Anomalies Log */}
                {importAnomalies.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center space-x-1">
                      <span>📝 System Anomaly Log ({importAnomalies.length} items handled)</span>
                    </h3>
                    
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-56 overflow-y-auto bg-white">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-extrabold uppercase select-none">
                            <th className="py-2.5 px-3.5 w-14">Row</th>
                            <th className="py-2.5 px-3.5 w-24">Issue Field</th>
                            <th className="py-2.5 px-3.5 w-24">Original Value</th>
                            <th className="py-2.5 px-3.5 w-36">Anomaly Type</th>
                            <th className="py-2.5 px-3.5">System Policy Action Taken</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {importAnomalies.map((an, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition text-slate-700">
                              <td className="py-2 px-3.5 font-bold text-slate-500">Row {an.row}</td>
                              <td className="py-2 px-3.5 font-bold text-slate-800">{an.field}</td>
                              <td className="py-2 px-3.5 font-mono text-slate-500">{an.value || "(empty)"}</td>
                              <td className="py-2 px-3.5 text-rose-500 font-bold">{an.type}</td>
                              <td className="py-2 px-3.5 text-emerald-600 font-semibold">{an.action}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {importError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg p-2.5 text-center font-bold">
                    {importError}
                  </div>
                )}

                <div className="flex space-x-2.5 justify-end border-t border-slate-150 pt-4">
                  <button
                    type="button"
                    onClick={closeImportWizard}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-205 text-xs font-bold rounded-lg cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={importLoading}
                    className="flex items-center space-x-1.5 px-5 py-2 bg-[#1CC29F] text-white disabled:opacity-55 text-xs font-bold rounded-lg hover:brightness-105 cursor-pointer transition active:scale-97 shadow-sm"
                  >
                    {importLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm Import</span>
                  </button>
                </div>
              </div>
            )}

            {importStep === 3 && (
              <div className="space-y-5 py-6 text-center max-w-md mx-auto">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100 flex items-center justify-center mx-auto shadow-2xs">
                  <span className="text-2xl font-black">✓</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 mb-1">Import Report Generated</h3>
                  <p className="text-xs text-slate-505 leading-relaxed font-medium">
                    Successfully reconciled and imported all records into the database! Anomalies were resolved based on Spreetail policies.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-3 text-center divide-x divide-slate-200 select-none shadow-3xs">
                  <div>
                    <div className="text-[9px] text-slate-455 uppercase font-black">Expenses</div>
                    <div className="text-lg font-black text-[#FF652F] mt-0.5">{importProcessedEntries.length + importDuplicates.length - Object.values(duplicateResolutions).filter(v => v === "DELETE").length}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-455 uppercase font-black">Settlements</div>
                    <div className="text-lg font-black text-emerald-500 mt-0.5">
                      {importProcessedEntries.filter(e => e.isSettlement).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-455 uppercase font-black">Anomalies</div>
                    <div className="text-lg font-black text-rose-500 mt-0.5">{importAnomalies.length}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeImportWizard}
                  className="w-full bg-[#1CC29F] text-white hover:brightness-105 font-bold text-xs py-2.5 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Close Importer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL: DEBT BREAKDOWN (Rohan's Request) --- */}
      {debtBreakdownModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[85vh] overflow-y-auto text-slate-800">
            <button
              onClick={() => setDebtBreakdownModal(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-655 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <span className="p-1 bg-teal-50 text-[#1CC29F] rounded-lg">📜</span>
                <span>Debt Ledger Breakdown</span>
              </h2>
              <p className="text-[10px] text-slate-500 mt-1">
                Itemized transaction ledger between <strong className="text-slate-700">{debtBreakdownModal.fromUser.name}</strong> and <strong className="text-slate-700">{debtBreakdownModal.toUser.name}</strong>
              </p>
            </div>

            <div className="space-y-4">
              {/* Debt summary */}
              <div className="bg-rose-50/50 border border-rose-100/60 rounded-xl p-3 flex justify-between items-center text-xs">
                <span className="text-rose-700 font-bold">Simplified Net Outstanding Balance</span>
                <span className="text-sm font-black text-rose-500 font-bold">₹{debtBreakdownModal.amount.toFixed(2)}</span>
              </div>

              {/* Items feed */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs bg-white text-[11px]">
                <div className="bg-slate-100 border-b border-slate-200 p-2.5 grid grid-cols-12 font-black text-slate-550 uppercase tracking-wider select-none text-[9px]">
                  <div className="col-span-2">Date</div>
                  <div className="col-span-4">Transaction</div>
                  <div className="col-span-2 text-right">Total Cost</div>
                  <div className="col-span-2 text-right">Debtor Share</div>
                  <div className="col-span-2 text-right">Net Effect</div>
                </div>

                <div className="divide-y divide-slate-150 max-h-60 overflow-y-auto">
                  {debtBreakdownModal.items.map((item, idx) => {
                    const isOwe = item.type === "OWE" || item.type === "PAYMENT_RCVD";
                    
                    return (
                      <div key={idx} className="p-2.5 grid grid-cols-12 items-center hover:bg-slate-50 transition text-slate-700">
                        <div className="col-span-2 text-slate-450 font-semibold">{new Date(item.date).toLocaleDateString()}</div>
                        <div className="col-span-4">
                          <div className="font-bold text-slate-800">{item.description}</div>
                          <div className="text-[8px] text-slate-400 mt-0.5">{item.text}</div>
                        </div>
                        <div className="col-span-2 text-right font-medium text-slate-500">₹{item.total.toFixed(2)}</div>
                        <div className="col-span-2 text-right font-bold text-slate-650">₹{item.share.toFixed(2)}</div>
                        <div className={`col-span-2 text-right font-black ${item.netEffect < 0 ? "text-rose-500" : "text-emerald-500"}`}>
                          {item.netEffect < 0 ? `-₹${Math.abs(item.netEffect).toFixed(2)}` : `+₹${item.netEffect.toFixed(2)}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setDebtBreakdownModal(null)}
                  className="px-4 py-1.5 bg-[#1CC29F] hover:brightness-105 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                >
                  Close Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
