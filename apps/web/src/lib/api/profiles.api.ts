export interface StudentProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  program?: string;
  branch?: string;
  institution?: string;
  graduationYear?: number;
  onboardingStep: number;
  onboardingComplete: boolean;
}

export type CreateProfileData = Partial<
  Omit<StudentProfile, 'id' | 'userId' | 'onboardingStep' | 'onboardingComplete'>
>;

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const profilesApi = {
  getMe: async (): Promise<{ data: StudentProfile }> => {
    const res = await fetch('/api/v1/profiles/me', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return { data: await res.json() };
  },

  create: async (data: CreateProfileData): Promise<{ data: StudentProfile }> => {
    const res = await fetch('/api/v1/profiles', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create profile');
    return { data: await res.json() };
  },

  update: async (data: CreateProfileData): Promise<{ data: StudentProfile }> => {
    const res = await fetch('/api/v1/profiles/me', {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return { data: await res.json() };
  },

  advanceOnboarding: async (step: number): Promise<{ data: StudentProfile }> => {
    const res = await fetch(`/api/v1/profiles/onboarding/advance/${step}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to advance onboarding');
    return { data: await res.json() };
  },
};
