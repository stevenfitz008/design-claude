import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({ description: 'Indicates if the request was successful' })
  success: boolean;

  @ApiProperty({ description: 'Response data' })
  data?: T;

  @ApiProperty({ description: 'Error message if success is false' })
  error?: string;

  @ApiProperty({ description: 'Additional error details' })
  details?: any;

  @ApiProperty({ description: 'Response message' })
  message?: string;

  @ApiProperty({ description: 'Error code for client handling' })
  code?: string;

  @ApiProperty({ description: 'Timestamp of the response' })
  timestamp: number;

  constructor(partial: Partial<ApiResponseDto<T>>) {
    Object.assign(this, partial);
    this.timestamp = Date.now();
  }

  static success<T>(data: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto({
      success: true,
      data,
      message,
    });
  }

  static error(error: string, code?: string, details?: any): ApiResponseDto {
    return new ApiResponseDto({
      success: false,
      error,
      code,
      details,
    });
  }
}