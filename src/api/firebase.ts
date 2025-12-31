import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
  limit,
  type Timestamp
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  updateProfile,
  type User
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// בדיקה בסיסית שהערכים קיימים – אם משהו חסר נקבל שגיאה ברורה בזמן ריצה
if (!firebaseConfig.apiKey) {
  // eslint-disable-next-line no-console
  console.error("Missing Firebase config: VITE_FIREBASE_API_KEY");
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export type UserRole = "admin" | "teacher" | "student";

const MAIN_ADMIN_EMAIL = "asaf.amir@gmail.com";

export interface AppUser {
  uid: string;
  email: string | null;
  role: UserRole;
}

// --------- Student entity ----------

export interface StudentProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  instructorId: string | null;
  projectTitle: string;
  projectProposalUrl: string;
  createdAt?: Timestamp;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export async function registerWithEmailAndPassword(
  payload: RegisterPayload
): Promise<User> {
  const { firstName, lastName, email, password } = payload;

  const cred = await createUserWithEmailAndPassword(auth, email, password);

  const displayName = `${firstName} ${lastName}`.trim();
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }

  const defaultRole: UserRole =
    email.toLowerCase() === MAIN_ADMIN_EMAIL ? "admin" : "student";

  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    email: cred.user.email,
    role: defaultRole
  });

  // אם זה לא האדמין הראשי – ניצור גם פרופיל סטודנט בסיסי
  if (defaultRole === "student") {
    await setDoc(doc(db, "students", cred.user.uid), {
      uid: cred.user.uid,
      firstName,
      lastName,
      email: cred.user.email,
      instructorId: null,
      projectTitle: "",
      projectProposalUrl: "",
      createdAt: serverTimestamp()
    });
  }

  return cred.user;
}

export async function loginWithEmailAndPassword(
  email: string,
  password: string
): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function fetchUserRole(uid: string): Promise<UserRole | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as { role?: UserRole };
  return data.role ?? null;
}

export async function getAllUsersWithRoles(): Promise<AppUser[]> {
  const usersCol = collection(db, "users");
  const snap = await getDocs(usersCol);

  return snap.docs.map((d) => {
    const data = d.data() as { uid?: string; email?: string | null; role?: UserRole };
    return {
      uid: data.uid ?? d.id,
      email: data.email ?? null,
      role: data.role ?? "student"
    };
  });
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { role });
}

export async function getStudentProfile(uid: string): Promise<StudentProfile | null> {
  const ref = doc(db, "students", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as StudentProfile;
  return { ...data, uid };
}

export async function listAllStudents(): Promise<StudentProfile[]> {
  const studentsCol = collection(db, "students");
  const snap = await getDocs(studentsCol);
  return snap.docs.map((d) => d.data() as StudentProfile);
}

export async function updateStudentProject(
  uid: string,
  data: Pick<StudentProfile, "projectTitle" | "projectProposalUrl">
): Promise<void> {
  const ref = doc(db, "students", uid);
  await setDoc(
    ref,
    {
      projectTitle: data.projectTitle,
      projectProposalUrl: data.projectProposalUrl
    },
    { merge: true }
  );
}

// --------- Weekly reports ----------

export interface WeeklyReportPayload {
  weekStartDate: Date;
  weeklyStatusText: string;
  blockersText: string;
  nextWeekDemoText: string;
  nextWeekTasksText: string;
}

export interface WeeklyReport extends WeeklyReportPayload {
  id: string;
  studentId: string;
  instructorNotesText: string;
  createdAt?: Timestamp;
}

export async function createWeeklyReport(
  studentId: string,
  payload: WeeklyReportPayload
): Promise<string> {
  const col = collection(db, "weeklyReports");
  const docRef = await addDoc(col, {
    studentId,
    weekStartDate: payload.weekStartDate,
    weeklyStatusText: payload.weeklyStatusText,
    blockersText: payload.blockersText,
    nextWeekDemoText: payload.nextWeekDemoText,
    nextWeekTasksText: payload.nextWeekTasksText,
    instructorNotesText: "",
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function listWeeklyReportsForStudent(
  studentId: string
): Promise<WeeklyReport[]> {
  if (!studentId) return [];
  const col = collection(db, "weeklyReports");
  const q = query(col, where("studentId", "==", studentId));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as Omit<WeeklyReport, "id">;
    return { id: d.id, ...data };
  });
}

export async function getLatestWeeklyReportForStudent(
  studentId: string
): Promise<WeeklyReport | null> {
  if (!studentId) return null;
  const col = collection(db, "weeklyReports");
  const q = query(col, where("studentId", "==", studentId));
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const reports: WeeklyReport[] = snap.docs.map((d) => {
    const data = d.data() as Omit<WeeklyReport, "id">;
    return { id: d.id, ...data };
  });

  reports.sort((a, b) => {
    const aDate =
      a.weekStartDate instanceof Date
        ? a.weekStartDate
        : // @ts-expect-error Firestore Timestamp
          a.weekStartDate.toDate();
    const bDate =
      b.weekStartDate instanceof Date
        ? b.weekStartDate
        : // @ts-expect-error Firestore Timestamp
          b.weekStartDate.toDate();
    return bDate.getTime() - aDate.getTime();
  });

  return reports[0] ?? null;
}

// --------- Future plan items ----------

export interface FuturePlanItem {
  id: string;
  studentId: string;
  weekIndex: number;
  description: string;
  tillDate?: Timestamp | Date | null;
  createdAt?: Timestamp;
}

export async function listFuturePlanItemsForStudent(
  studentId: string
): Promise<FuturePlanItem[]> {
  if (!studentId) return [];
  const col = collection(db, "futurePlanItems");
  const q = query(col, where("studentId", "==", studentId));
  const snap = await getDocs(q);

  const items = snap.docs.map((d) => {
    const data = d.data() as Omit<FuturePlanItem, "id">;
    return { id: d.id, ...data };
  });

  return items.sort((a, b) => a.weekIndex - b.weekIndex);
}

export async function createFuturePlanItem(
  studentId: string,
  weekIndex: number
): Promise<FuturePlanItem> {
  const col = collection(db, "futurePlanItems");
  const docRef = await addDoc(col, {
    studentId,
    weekIndex,
    description: "",
    tillDate: null,
    createdAt: serverTimestamp()
  });

  return {
    id: docRef.id,
    studentId,
    weekIndex,
    description: "",
    tillDate: null
  };
}

export async function updateFuturePlanItemDescription(
  id: string,
  data: { description: string; tillDate: Date | null }
): Promise<void> {
  const ref = doc(db, "futurePlanItems", id);
  await updateDoc(ref, {
    description: data.description,
    tillDate: data.tillDate
  });
}

export async function deleteFuturePlanItem(id: string): Promise<void> {
  const ref = doc(db, "futurePlanItems", id);
  await deleteDoc(ref);
}

export async function updateInstructorNotes(
  reportId: string,
  instructorNotesText: string
): Promise<void> {
  const ref = doc(db, "weeklyReports", reportId);
  await updateDoc(ref, { instructorNotesText });
}

export default app;

