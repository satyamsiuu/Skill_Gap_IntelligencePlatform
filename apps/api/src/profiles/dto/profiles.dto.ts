import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsUrl } from 'class-validator';

export class CreateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Software Engineer student' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ example: 'San Francisco, CA' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/demo/image/upload/v15421/avatar.jpg',
  })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsString()
  @IsOptional()
  program?: string;

  @ApiPropertyOptional({ example: 'AI & ML' })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({ example: 'University of Engineering' })
  @IsString()
  @IsOptional()
  institution?: string;

  @ApiPropertyOptional({ example: 2026 })
  @IsInt()
  @Min(1900)
  @Max(2100)
  @IsOptional()
  graduationYear?: number;
}
