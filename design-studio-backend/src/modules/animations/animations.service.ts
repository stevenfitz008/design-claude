import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTimelineDto, UpdateTimelineDto, TimelineDto, TimelineTrackDto, KeyframeDto } from './dto/timeline.dto';

@Injectable()
export class AnimationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTimeline(createTimelineDto: CreateTimelineDto, userId: string): Promise<TimelineDto> {
    // Verify project exists and user has access
    const project = await this.prisma.project.findFirst({
      where: {
        id: createTimelineDto.projectId,
        userId: userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    const timeline = await this.prisma.timeline.create({
      data: {
        name: createTimelineDto.name,
        duration: createTimelineDto.duration,
        frameRate: createTimelineDto.frameRate || 60,
        loop: createTimelineDto.loop || false,
        autoPlay: createTimelineDto.autoPlay || false,
        projectId: createTimelineDto.projectId,
      },
      include: {
        tracks: {
          include: {
            keyframes: {
              orderBy: { time: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return this.mapToTimelineDto(timeline);
  }

  async findTimelinesByProject(projectId: string, userId: string): Promise<TimelineDto[]> {
    // Verify project exists and user has access
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    const timelines = await this.prisma.timeline.findMany({
      where: { projectId },
      include: {
        tracks: {
          include: {
            keyframes: {
              orderBy: { time: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return timelines.map(timeline => this.mapToTimelineDto(timeline));
  }

  async findTimelineById(timelineId: string, userId: string): Promise<TimelineDto> {
    const timeline = await this.prisma.timeline.findFirst({
      where: {
        id: timelineId,
        project: {
          userId: userId,
        },
      },
      include: {
        tracks: {
          include: {
            keyframes: {
              orderBy: { time: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!timeline) {
      throw new NotFoundException('Timeline not found or access denied');
    }

    return this.mapToTimelineDto(timeline);
  }

  async updateTimeline(timelineId: string, updateTimelineDto: UpdateTimelineDto, userId: string): Promise<TimelineDto> {
    // Verify timeline exists and user has access
    const existingTimeline = await this.prisma.timeline.findFirst({
      where: {
        id: timelineId,
        project: {
          userId: userId,
        },
      },
    });

    if (!existingTimeline) {
      throw new NotFoundException('Timeline not found or access denied');
    }

    // Update timeline properties
    const updatedTimeline = await this.prisma.timeline.update({
      where: { id: timelineId },
      data: {
        name: updateTimelineDto.name,
        duration: updateTimelineDto.duration,
        frameRate: updateTimelineDto.frameRate,
        loop: updateTimelineDto.loop,
        autoPlay: updateTimelineDto.autoPlay,
      },
      include: {
        tracks: {
          include: {
            keyframes: {
              orderBy: { time: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Update tracks if provided
    if (updateTimelineDto.tracks) {
      await this.updateTimelineTracks(timelineId, updateTimelineDto.tracks);
    }

    // Fetch updated timeline with all relations
    const finalTimeline = await this.prisma.timeline.findUnique({
      where: { id: timelineId },
      include: {
        tracks: {
          include: {
            keyframes: {
              orderBy: { time: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return this.mapToTimelineDto(finalTimeline);
  }

  async deleteTimeline(timelineId: string, userId: string): Promise<void> {
    const timeline = await this.prisma.timeline.findFirst({
      where: {
        id: timelineId,
        project: {
          userId: userId,
        },
      },
    });

    if (!timeline) {
      throw new NotFoundException('Timeline not found or access denied');
    }

    await this.prisma.timeline.delete({
      where: { id: timelineId },
    });
  }

  async addTrackToTimeline(timelineId: string, trackData: Omit<TimelineTrackDto, 'id'>, userId: string): Promise<TimelineTrackDto> {
    // Verify timeline exists and user has access
    const timeline = await this.prisma.timeline.findFirst({
      where: {
        id: timelineId,
        project: {
          userId: userId,
        },
      },
    });

    if (!timeline) {
      throw new NotFoundException('Timeline not found or access denied');
    }

    const track = await this.prisma.timelineTrack.create({
      data: {
        name: trackData.name,
        targetId: trackData.targetId,
        property: trackData.property,
        enabled: trackData.enabled !== undefined ? trackData.enabled : true,
        timelineId: timelineId,
      },
      include: {
        keyframes: {
          orderBy: { time: 'asc' },
        },
      },
    });

    // Add keyframes if provided
    if (trackData.keyframes && trackData.keyframes.length > 0) {
      await this.addKeyframesToTrack(track.id, trackData.keyframes);
    }

    // Return updated track
    const updatedTrack = await this.prisma.timelineTrack.findUnique({
      where: { id: track.id },
      include: {
        keyframes: {
          orderBy: { time: 'asc' },
        },
      },
    });

    return this.mapToTrackDto(updatedTrack);
  }

  async updateTrack(trackId: string, trackData: Partial<TimelineTrackDto>, userId: string): Promise<TimelineTrackDto> {
    // Verify track exists and user has access
    const existingTrack = await this.prisma.timelineTrack.findFirst({
      where: {
        id: trackId,
        timeline: {
          project: {
            userId: userId,
          },
        },
      },
    });

    if (!existingTrack) {
      throw new NotFoundException('Track not found or access denied');
    }

    const updatedTrack = await this.prisma.timelineTrack.update({
      where: { id: trackId },
      data: {
        name: trackData.name,
        targetId: trackData.targetId,
        property: trackData.property,
        enabled: trackData.enabled,
      },
      include: {
        keyframes: {
          orderBy: { time: 'asc' },
        },
      },
    });

    // Update keyframes if provided
    if (trackData.keyframes) {
      await this.updateTrackKeyframes(trackId, trackData.keyframes);
    }

    // Return final updated track
    const finalTrack = await this.prisma.timelineTrack.findUnique({
      where: { id: trackId },
      include: {
        keyframes: {
          orderBy: { time: 'asc' },
        },
      },
    });

    return this.mapToTrackDto(finalTrack);
  }

  async deleteTrack(trackId: string, userId: string): Promise<void> {
    const track = await this.prisma.timelineTrack.findFirst({
      where: {
        id: trackId,
        timeline: {
          project: {
            userId: userId,
          },
        },
      },
    });

    if (!track) {
      throw new NotFoundException('Track not found or access denied');
    }

    await this.prisma.timelineTrack.delete({
      where: { id: trackId },
    });
  }

  private async updateTimelineTracks(timelineId: string, tracks: TimelineTrackDto[]): Promise<void> {
    // Delete existing tracks that are not in the update
    const trackIds = tracks.map(track => track.id).filter(id => id);
    if (trackIds.length > 0) {
      await this.prisma.timelineTrack.deleteMany({
        where: {
          timelineId: timelineId,
          id: {
            notIn: trackIds,
          },
        },
      });
    } else {
      // Delete all tracks if no IDs provided (complete replacement)
      await this.prisma.timelineTrack.deleteMany({
        where: { timelineId: timelineId },
      });
    }

    // Update or create tracks
    for (const trackData of tracks) {
      if (trackData.id) {
        // Update existing track
        await this.prisma.timelineTrack.update({
          where: { id: trackData.id },
          data: {
            name: trackData.name,
            targetId: trackData.targetId,
            property: trackData.property,
            enabled: trackData.enabled,
          },
        });
        
        // Update keyframes
        await this.updateTrackKeyframes(trackData.id, trackData.keyframes);
      } else {
        // Create new track
        const newTrack = await this.prisma.timelineTrack.create({
          data: {
            name: trackData.name,
            targetId: trackData.targetId,
            property: trackData.property,
            enabled: trackData.enabled !== undefined ? trackData.enabled : true,
            timelineId: timelineId,
          },
        });

        // Add keyframes
        if (trackData.keyframes && trackData.keyframes.length > 0) {
          await this.addKeyframesToTrack(newTrack.id, trackData.keyframes);
        }
      }
    }
  }

  private async updateTrackKeyframes(trackId: string, keyframes: KeyframeDto[]): Promise<void> {
    // Delete existing keyframes that are not in the update
    const keyframeIds = keyframes.map(kf => kf.id).filter(id => id);
    if (keyframeIds.length > 0) {
      await this.prisma.keyframe.deleteMany({
        where: {
          trackId: trackId,
          id: {
            notIn: keyframeIds,
          },
        },
      });
    } else {
      // Delete all keyframes if no IDs provided (complete replacement)
      await this.prisma.keyframe.deleteMany({
        where: { trackId: trackId },
      });
    }

    // Update or create keyframes
    for (const keyframeData of keyframes) {
      if (keyframeData.id) {
        // Update existing keyframe
        await this.prisma.keyframe.update({
          where: { id: keyframeData.id },
          data: {
            time: keyframeData.time,
            value: keyframeData.value,
            easing: keyframeData.easing || 'LINEAR',
            easingParams: keyframeData.easingParams || null,
          },
        });
      } else {
        // Create new keyframe
        await this.prisma.keyframe.create({
          data: {
            time: keyframeData.time,
            value: keyframeData.value,
            easing: keyframeData.easing || 'LINEAR',
            easingParams: keyframeData.easingParams || null,
            trackId: trackId,
          },
        });
      }
    }
  }

  private async addKeyframesToTrack(trackId: string, keyframes: KeyframeDto[]): Promise<void> {
    for (const keyframeData of keyframes) {
      await this.prisma.keyframe.create({
        data: {
          time: keyframeData.time,
          value: keyframeData.value,
          easing: keyframeData.easing || 'LINEAR',
          easingParams: keyframeData.easingParams || null,
          trackId: trackId,
        },
      });
    }
  }

  private mapToTimelineDto(timeline: any): TimelineDto {
    return {
      id: timeline.id,
      name: timeline.name,
      duration: timeline.duration,
      frameRate: timeline.frameRate,
      loop: timeline.loop,
      autoPlay: timeline.autoPlay,
      tracks: timeline.tracks.map(track => this.mapToTrackDto(track)),
    };
  }

  private mapToTrackDto(track: any): TimelineTrackDto {
    return {
      id: track.id,
      name: track.name,
      targetId: track.targetId,
      property: track.property,
      enabled: track.enabled,
      keyframes: track.keyframes.map(keyframe => this.mapToKeyframeDto(keyframe)),
    };
  }

  private mapToKeyframeDto(keyframe: any): KeyframeDto {
    return {
      id: keyframe.id,
      time: keyframe.time,
      value: keyframe.value,
      easing: keyframe.easing,
      easingParams: keyframe.easingParams,
    };
  }
}