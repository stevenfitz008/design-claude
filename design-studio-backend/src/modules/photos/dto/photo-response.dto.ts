import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PhotoUrlsDto {
  @ApiProperty({ description: 'Raw photo URL' })
  raw: string;

  @ApiProperty({ description: 'Full size photo URL' })
  full: string;

  @ApiProperty({ description: 'Regular size photo URL' })
  regular: string;

  @ApiProperty({ description: 'Small size photo URL' })
  small: string;

  @ApiProperty({ description: 'Thumbnail photo URL' })
  thumb: string;
}

export class PhotoUserDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Username' })
  username: string;

  @ApiProperty({ description: 'Display name' })
  name: string;

  @ApiPropertyOptional({ description: 'User profile image' })
  profile_image?: {
    small: string;
    medium: string;
    large: string;
  };

  @ApiPropertyOptional({ description: 'User portfolio URL' })
  portfolio_url?: string;
}

export class PhotoResponseDto {
  @ApiProperty({ description: 'Photo ID' })
  id: string;

  @ApiProperty({ description: 'Photo slug' })
  slug: string;

  @ApiProperty({ description: 'Photo description' })
  description: string;

  @ApiPropertyOptional({ description: 'Alt description' })
  alt_description?: string;

  @ApiProperty({ description: 'Photo URLs' })
  urls: PhotoUrlsDto;

  @ApiProperty({ description: 'Photo width' })
  width: number;

  @ApiProperty({ description: 'Photo height' })
  height: number;

  @ApiProperty({ description: 'Primary color' })
  color: string;

  @ApiProperty({ description: 'Blur hash' })
  blur_hash: string;

  @ApiProperty({ description: 'Number of likes' })
  likes: number;

  @ApiProperty({ description: 'Photo user/photographer' })
  user: PhotoUserDto;

  @ApiPropertyOptional({ description: 'Photo tags' })
  tags?: Array<{
    type: string;
    title: string;
  }>;

  @ApiProperty({ description: 'Download URL for tracking' })
  download_url: string;
}

export class PhotoSearchResponseDto {
  @ApiProperty({ description: 'Total number of photos' })
  total: number;

  @ApiProperty({ description: 'Total pages' })
  total_pages: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Results per page' })
  per_page: number;

  @ApiProperty({ description: 'Search results', type: [PhotoResponseDto] })
  results: PhotoResponseDto[];
}