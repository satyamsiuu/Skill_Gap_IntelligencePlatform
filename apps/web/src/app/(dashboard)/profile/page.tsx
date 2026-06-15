'use client';

import { useQuery } from '@tanstack/react-query';
import { profilesApi } from '@/lib/api/profiles.api';

export default function ProfilePage() {
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profilesApi.getMe,
  });

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground">Loading profile...</div>;
  }

  if (error || !profile?.data) {
    return (
      <div className="p-12 text-center text-destructive">
        Failed to load profile. Are you sure you completed onboarding?
      </div>
    );
  }

  const p = profile.data;

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="bg-card border rounded-2xl p-8 shadow-sm">
        <div className="flex items-center space-x-6 mb-8">
          <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center text-3xl font-bold text-primary">
            {p.firstName?.[0] || 'U'}
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {p.firstName} {p.lastName}
            </h1>
            <p className="text-muted-foreground">
              {p.program} at {p.institution}
            </p>
            <p className="text-sm mt-1">{p.location}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">About Me</h2>
            <p className="text-muted-foreground">{p.bio || 'No bio provided.'}</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Education</h2>
            <ul className="space-y-2">
              <li>
                <span className="font-medium text-foreground">Institution:</span>{' '}
                <span className="text-muted-foreground">{p.institution}</span>
              </li>
              <li>
                <span className="font-medium text-foreground">Program:</span>{' '}
                <span className="text-muted-foreground">
                  {p.program} {p.branch ? `- ${p.branch}` : ''}
                </span>
              </li>
              <li>
                <span className="font-medium text-foreground">Class of:</span>{' '}
                <span className="text-muted-foreground">{p.graduationYear}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex justify-end">
          <button className="px-4 py-2 border rounded-md hover:bg-muted text-sm font-medium">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
