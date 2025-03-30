import { User } from 'firebase/auth';

export interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (userProfile: any) => Promise<void>;
}

export function useAuth(): AuthContextType;
export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element;