import {
  Controller,
  Get,
  Delete,
  Param,
  Res,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
} from '@nestjs/swagger';
import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { MediaService } from './media.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Media')
@Controller('api/v1/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Public()
  @Get(':storedName')
  @ApiOperation({ summary: 'Serve image file' })
  @ApiParam({ name: 'storedName', type: 'string' })
  @ApiResponse({ status: 200, description: 'Image file' })
  @ApiResponse({ status: 404, description: 'File not found' })
  serveFile(
    @Param('storedName') storedName: string,
    @Res() res: express.Response,
  ): void {
    // Validate storedName to prevent path traversal
    if (
      storedName.includes('..') ||
      storedName.includes('/') ||
      storedName.includes('\\')
    ) {
      throw new NotFoundException('File not found');
    }

    const filePath = this.mediaService.getFilePath(storedName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };

    res.setHeader('Content-Type', mimeMap[ext] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    fs.createReadStream(filePath).pipe(res);
  }

  @Public()
  @Get('thumb/:storedName')
  @ApiOperation({ summary: 'Serve thumbnail' })
  @ApiParam({ name: 'storedName', type: 'string' })
  @ApiResponse({ status: 200, description: 'Thumbnail file' })
  @ApiResponse({ status: 404, description: 'Thumbnail not found' })
  serveThumbnail(
    @Param('storedName') storedName: string,
    @Res() res: express.Response,
  ): void {
    // Validate storedName to prevent path traversal
    if (
      storedName.includes('..') ||
      storedName.includes('/') ||
      storedName.includes('\\')
    ) {
      throw new NotFoundException('File not found');
    }

    const filePath = this.mediaService.getThumbnailPath(storedName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Thumbnail not found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };

    res.setHeader('Content-Type', mimeMap[ext] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    fs.createReadStream(filePath).pipe(res);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('session_token')
  @ApiOperation({ summary: 'Delete media file' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Media deleted' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async deleteFile(@Param('id', ParseUUIDPipe) id: string) {
    return this.mediaService.deleteFile(id);
  }
}
