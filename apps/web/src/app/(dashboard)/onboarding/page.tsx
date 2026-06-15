'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profilesApi } from '@/lib/api/profiles.api';
import { documentsApi } from '@/lib/api/documents.api';

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    program: '',
    institution: '',
    graduationYear: new Date().getFullYear(),
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  // We could fetch the current profile to see where they are
  const { data: profile } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profilesApi.getMe,
    retry: false,
  });

  const createProfileMutation = useMutation({
    mutationFn: profilesApi.create,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', 'me'], data);
      setStep(2);
    },
    onError: (err: Error) => setError(err.message || 'Failed to save profile'),
  });

  const updateProfileMutation = useMutation({
    mutationFn: profilesApi.update,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', 'me'], data);
      setStep(3);
    },
    onError: (err: Error) => setError(err.message || 'Failed to update profile'),
  });

  const advanceMutation = useMutation({
    mutationFn: profilesApi.advanceOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      router.push('/profile');
    },
    onError: (err: Error) => setError(err.message || 'Failed to finish onboarding'),
  });

  const uploadResumeMutation = useMutation({
    mutationFn: (file: File) => documentsApi.upload(file, 'RESUME'),
    onError: (err: Error) => setError(err.message || 'Failed to upload resume'),
  });

  const handleNext = async () => {
    setError('');
    if (step === 1) {
      if (!profile?.data) {
        createProfileMutation.mutate({
          firstName: formData.firstName,
          lastName: formData.lastName,
          bio: formData.bio,
          location: formData.location,
        });
      } else {
        updateProfileMutation.mutate({
          firstName: formData.firstName,
          lastName: formData.lastName,
          bio: formData.bio,
          location: formData.location,
        });
      }
    } else if (step === 2) {
      updateProfileMutation.mutate({
        program: formData.program,
        institution: formData.institution,
        graduationYear: formData.graduationYear,
      });
    } else if (step === 3) {
      if (resumeFile) {
        await uploadResumeMutation.mutateAsync(resumeFile);
      }
      advanceMutation.mutate(4);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to your Profile!</h1>
        <p className="text-muted-foreground">Let&apos;s get you set up. Step {step} of 3</p>
        <div className="w-full bg-secondary h-2 mt-4 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">{error}</div>
      )}

      <div className="bg-card p-6 rounded-xl border shadow-sm">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <input
                  type="text"
                  className="w-full p-2 rounded-md border bg-background"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <input
                  type="text"
                  className="w-full p-2 rounded-md border bg-background"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <input
                type="text"
                className="w-full p-2 rounded-md border bg-background"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="San Francisco, CA"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bio (Optional)</label>
              <textarea
                className="w-full p-2 rounded-md border bg-background min-h-[100px]"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="A short intro about yourself..."
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Education</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">Institution</label>
              <input
                type="text"
                className="w-full p-2 rounded-md border bg-background"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="University of Science"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Program / Degree</label>
              <input
                type="text"
                className="w-full p-2 rounded-md border bg-background"
                value={formData.program}
                onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                placeholder="B.S. Computer Science"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Expected Graduation Year</label>
              <input
                type="number"
                className="w-full p-2 rounded-md border bg-background"
                value={formData.graduationYear}
                onChange={(e) =>
                  setFormData({ ...formData, graduationYear: parseInt(e.target.value) || 2026 })
                }
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Resume Upload</h2>
            <p className="text-sm text-muted-foreground">
              Upload your resume (PDF/DOCX) to help us analyze your skills.
            </p>
            <div className="border-2 border-dashed rounded-xl p-8 text-center bg-muted/30">
              <input
                type="file"
                id="resume-upload"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setResumeFile(e.target.files[0]);
                  }
                }}
              />
              <label
                htmlFor="resume-upload"
                className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
              >
                {resumeFile ? resumeFile.name : 'Select File'}
              </label>
              {resumeFile && (
                <p className="text-xs text-muted-foreground mt-2">
                  {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
            <p className="text-xs text-center text-muted-foreground">Max size: 5MB</p>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={
              createProfileMutation.isPending ||
              updateProfileMutation.isPending ||
              uploadResumeMutation.isPending ||
              advanceMutation.isPending
            }
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {createProfileMutation.isPending ||
            updateProfileMutation.isPending ||
            uploadResumeMutation.isPending ||
            advanceMutation.isPending
              ? 'Saving...'
              : step === 3
                ? 'Complete'
                : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
