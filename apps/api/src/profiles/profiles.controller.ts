import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/profiles.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AnyRole } from '../common/decorators/roles.decorator';
import type { RequestUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Profiles')
@Controller('profiles')
@ApiBearerAuth('access-token')
@AnyRole() // Requires authentication
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMyProfile(@CurrentUser() user: RequestUser) {
    return this.profilesService.getProfileByUserId(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create initial profile' })
  async createProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateProfileDto,
  ) {
    return this.profilesService.createProfile(user.id, dto);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile details' })
  async updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.updateProfile(user.id, dto);
  }

  @Post('onboarding/advance/:step')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Advance onboarding step' })
  async advanceOnboarding(
    @CurrentUser() user: RequestUser,
    @Param('step', ParseIntPipe) step: number,
  ) {
    return this.profilesService.advanceOnboarding(user.id, step);
  }
}
