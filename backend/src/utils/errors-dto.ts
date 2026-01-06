import { ApiProperty } from "@nestjs/swagger";

export class ErrorBadRequestDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: "Validation failed" })
  message: string;

  @ApiProperty({ example: "2024-01-15T12:00:00Z" })
  timestamp: string;

  @ApiProperty({ example: "/api/v1/uploads" })
  path: string;
}

export class ErrorNotFoundDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: "Resource not found" })
  message: string;

  @ApiProperty({ example: "2024-01-15T12:00:00Z" })
  timestamp: string;

  @ApiProperty({ example: "/api/v1/resource/123" })
  path: string;
}

export class ErrorUnauthorizedDto {
  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: "Unauthorized" })
  message: string;

  @ApiProperty({ example: "2024-01-15T12:00:00Z" })
  timestamp: string;

  @ApiProperty({ example: "/api/v1/protected" })
  path: string;
}
