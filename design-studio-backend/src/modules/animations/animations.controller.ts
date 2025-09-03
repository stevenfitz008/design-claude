import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AnimationsService } from './animations.service';
import { 
  CreateTimelineDto, 
  UpdateTimelineDto, 
  TimelineDto, 
  TimelineResponseDto,
  TimelineTrackDto 
} from './dto/timeline.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Animations')
@ApiBearerAuth()
@Controller('animations')
@UseGuards(JwtAuthGuard)
export class AnimationsController {
  constructor(private readonly animationsService: AnimationsService) {}

  @Post('timelines')
  @ApiOperation({ summary: 'Create a new timeline for a project' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Timeline created successfully',
    type: TimelineResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid timeline data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found or access denied',
  })
  async createTimeline(
    @Body() createTimelineDto: CreateTimelineDto,
    @Request() req: any,
  ): Promise<ApiResponseDto<TimelineDto>> {
    const timeline = await this.animationsService.createTimeline(
      createTimelineDto,
      req.user.id,
    );

    return ApiResponseDto.success(timeline, 'Timeline created successfully');
  }

  @Get('timelines/project/:projectId')
  @ApiOperation({ summary: 'Get all timelines for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Timelines retrieved successfully',
    type: [TimelineDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found or access denied',
  })
  async getTimelinesByProject(
    @Param('projectId') projectId: string,
    @Request() req: any,
  ): Promise<ApiResponseDto<TimelineDto[]>> {
    const timelines = await this.animationsService.findTimelinesByProject(
      projectId,
      req.user.id,
    );

    return ApiResponseDto.success(timelines, 'Timelines retrieved successfully');
  }

  @Get('timelines/:timelineId')
  @ApiOperation({ summary: 'Get timeline by ID' })
  @ApiParam({ name: 'timelineId', description: 'Timeline ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Timeline retrieved successfully',
    type: TimelineDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Timeline not found or access denied',
  })
  async getTimelineById(
    @Param('timelineId') timelineId: string,
    @Request() req: any,
  ): Promise<ApiResponseDto<TimelineDto>> {
    const timeline = await this.animationsService.findTimelineById(
      timelineId,
      req.user.id,
    );

    return ApiResponseDto.success(timeline, 'Timeline retrieved successfully');
  }

  @Put('timelines/:timelineId')
  @ApiOperation({ summary: 'Update timeline' })
  @ApiParam({ name: 'timelineId', description: 'Timeline ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Timeline updated successfully',
    type: TimelineDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Timeline not found or access denied',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid timeline data',
  })
  async updateTimeline(
    @Param('timelineId') timelineId: string,
    @Body() updateTimelineDto: UpdateTimelineDto,
    @Request() req: any,
  ): Promise<ApiResponseDto<TimelineDto>> {
    const timeline = await this.animationsService.updateTimeline(
      timelineId,
      updateTimelineDto,
      req.user.id,
    );

    return ApiResponseDto.success(timeline, 'Timeline updated successfully');
  }

  @Delete('timelines/:timelineId')
  @ApiOperation({ summary: 'Delete timeline' })
  @ApiParam({ name: 'timelineId', description: 'Timeline ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Timeline deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Timeline not found or access denied',
  })
  async deleteTimeline(
    @Param('timelineId') timelineId: string,
    @Request() req: any,
  ): Promise<ApiResponseDto<null>> {
    await this.animationsService.deleteTimeline(timelineId, req.user.id);

    return ApiResponseDto.success(null, 'Timeline deleted successfully');
  }

  @Post('timelines/:timelineId/tracks')
  @ApiOperation({ summary: 'Add track to timeline' })
  @ApiParam({ name: 'timelineId', description: 'Timeline ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Track added successfully',
    type: TimelineTrackDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Timeline not found or access denied',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid track data',
  })
  async addTrackToTimeline(
    @Param('timelineId') timelineId: string,
    @Body() trackData: Omit<TimelineTrackDto, 'id'>,
    @Request() req: any,
  ): Promise<ApiResponseDto<TimelineTrackDto>> {
    const track = await this.animationsService.addTrackToTimeline(
      timelineId,
      trackData,
      req.user.id,
    );

    return ApiResponseDto.success(track, 'Track added successfully');
  }

  @Put('tracks/:trackId')
  @ApiOperation({ summary: 'Update timeline track' })
  @ApiParam({ name: 'trackId', description: 'Track ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Track updated successfully',
    type: TimelineTrackDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Track not found or access denied',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid track data',
  })
  async updateTrack(
    @Param('trackId') trackId: string,
    @Body() trackData: Partial<TimelineTrackDto>,
    @Request() req: any,
  ): Promise<ApiResponseDto<TimelineTrackDto>> {
    const track = await this.animationsService.updateTrack(
      trackId,
      trackData,
      req.user.id,
    );

    return ApiResponseDto.success(track, 'Track updated successfully');
  }

  @Delete('tracks/:trackId')
  @ApiOperation({ summary: 'Delete timeline track' })
  @ApiParam({ name: 'trackId', description: 'Track ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Track deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Track not found or access denied',
  })
  async deleteTrack(
    @Param('trackId') trackId: string,
    @Request() req: any,
  ): Promise<ApiResponseDto<null>> {
    await this.animationsService.deleteTrack(trackId, req.user.id);

    return ApiResponseDto.success(null, 'Track deleted successfully');
  }

  @Get('timelines/:timelineId/export')
  @ApiOperation({ summary: 'Export timeline data for frontend animation engine' })
  @ApiParam({ name: 'timelineId', description: 'Timeline ID' })
  @ApiQuery({ 
    name: 'format', 
    description: 'Export format (json, lottie)', 
    required: false,
    enum: ['json', 'lottie'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Timeline exported successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Timeline not found or access denied',
  })
  async exportTimeline(
    @Param('timelineId') timelineId: string,
    @Query('format') format: 'json' | 'lottie' = 'json',
    @Request() req: any,
  ): Promise<ApiResponseDto<any>> {
    const timeline = await this.animationsService.findTimelineById(
      timelineId,
      req.user.id,
    );

    // Transform timeline data for different export formats
    let exportData: any;
    
    if (format === 'lottie') {
      // Convert to Lottie-compatible format (simplified example)
      exportData = {
        v: '5.7.4', // Lottie version
        fr: timeline.frameRate,
        ip: 0,
        op: Math.ceil(timeline.duration * timeline.frameRate),
        w: 1920, // Default canvas width
        h: 1080, // Default canvas height
        nm: timeline.name,
        ddd: 0,
        layers: timeline.tracks.map((track, index) => ({
          ddd: 0,
          ind: index + 1,
          ty: 4, // Shape layer
          nm: track.name,
          sr: 1,
          ks: {
            o: { a: 0, k: 100 }, // Opacity
            r: { a: 0, k: 0 },   // Rotation
            p: { a: 0, k: [0, 0, 0] }, // Position
            a: { a: 0, k: [0, 0, 0] }, // Anchor
            s: { a: 0, k: [100, 100, 100] }, // Scale
          },
          ao: 0,
          ip: 0,
          op: Math.ceil(timeline.duration * timeline.frameRate),
          st: 0,
        })),
      };
    } else {
      // Standard JSON export
      exportData = {
        ...timeline,
        metadata: {
          exportedAt: new Date().toISOString(),
          format: 'design-studio-timeline',
          version: '1.0.0',
        },
      };
    }

    return ApiResponseDto.success(exportData, `Timeline exported as ${format.toUpperCase()} successfully`);
  }

  @Post('timelines/:timelineId/preview')
  @ApiOperation({ summary: 'Generate timeline preview frames' })
  @ApiParam({ name: 'timelineId', description: 'Timeline ID' })
  @ApiQuery({ 
    name: 'frames', 
    description: 'Number of preview frames to generate', 
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preview frames generated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Timeline not found or access denied',
  })
  async generateTimelinePreview(
    @Param('timelineId') timelineId: string,
    @Query('frames') frames: number = 10,
    @Request() req: any,
  ): Promise<ApiResponseDto<any[]>> {
    const timeline = await this.animationsService.findTimelineById(
      timelineId,
      req.user.id,
    );

    // Generate preview frames at regular intervals
    const frameInterval = timeline.duration / (frames - 1);
    const previewFrames = [];

    for (let i = 0; i < frames; i++) {
      const time = i * frameInterval;
      const frameData = {
        time: time,
        frame: Math.round(time * timeline.frameRate),
        elements: {},
      };

      // Calculate interpolated values for each track at this time
      timeline.tracks.forEach(track => {
        if (!track.enabled || track.keyframes.length === 0) {
          return;
        }

        // Find surrounding keyframes
        let prevKeyframe = null;
        let nextKeyframe = null;

        for (let j = 0; j < track.keyframes.length; j++) {
          const keyframe = track.keyframes[j];
          if (keyframe.time <= time) {
            prevKeyframe = keyframe;
          }
          if (keyframe.time >= time && !nextKeyframe) {
            nextKeyframe = keyframe;
            break;
          }
        }

        // Interpolate value
        let value;
        if (!prevKeyframe) {
          value = nextKeyframe?.value || null;
        } else if (!nextKeyframe || prevKeyframe.time === nextKeyframe.time) {
          value = prevKeyframe.value;
        } else {
          // Linear interpolation (simplified - real implementation would use easing)
          const progress = (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time);
          if (typeof prevKeyframe.value === 'number' && typeof nextKeyframe.value === 'number') {
            value = prevKeyframe.value + (nextKeyframe.value - prevKeyframe.value) * progress;
          } else {
            value = progress < 0.5 ? prevKeyframe.value : nextKeyframe.value;
          }
        }

        if (!frameData.elements[track.targetId]) {
          frameData.elements[track.targetId] = {};
        }
        frameData.elements[track.targetId][track.property] = value;
      });

      previewFrames.push(frameData);
    }

    return ApiResponseDto.success(previewFrames, 'Preview frames generated successfully');
  }
}