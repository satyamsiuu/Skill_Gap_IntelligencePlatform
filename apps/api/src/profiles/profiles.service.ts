import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/profiles.dto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async getProfileByUserId(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        skills: true,
        targetRoles: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }
    return profile;
  }

  async createProfile(userId: string, dto: CreateProfileDto) {
    const existing = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.studentProfile.create({
      data: {
        userId,
        ...dto,
        onboardingStep: 1, // Advance step upon creation
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.getProfileByUserId(userId);
    return this.prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        ...dto,
      },
    });
  }

  async advanceOnboarding(userId: string, step: number) {
    const profile = await this.getProfileByUserId(userId);

    const updates: { onboardingStep: number; onboardingComplete?: boolean } = {
      onboardingStep: step,
    };
    if (step >= 4) {
      updates.onboardingComplete = true;
    }

    return this.prisma.studentProfile.update({
      where: { id: profile.id },
      data: updates,
    });
  }
}
