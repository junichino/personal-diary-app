import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { DiaryService } from './diary.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { DiaryQueryDto } from './dto/diary-query.dto';

@ApiTags('Diary')
@ApiCookieAuth('session_token')
@Controller('api/v1/diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List diary entries (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Diary entries retrieved' })
  async findAll(@Query() query: DiaryQueryDto) {
    return this.diaryService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single diary entry with media and tags' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Diary entry retrieved' })
  @ApiResponse({ status: 404, description: 'Diary entry not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.diaryService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create diary entry with optional images' })
  @ApiResponse({ status: 201, description: 'Diary entry created' })
  async create(
    @Body() dto: CreateDiaryDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.diaryService.create(dto, files);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('newImages', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update diary entry' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Diary entry updated' })
  @ApiResponse({ status: 404, description: 'Diary entry not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDiaryDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.diaryService.update(id, dto, files);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete diary entry' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Diary entry deleted' })
  @ApiResponse({ status: 404, description: 'Diary entry not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.diaryService.remove(id);
  }

  @Patch(':id/pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle pin diary entry' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Pin toggled' })
  async togglePin(@Param('id', ParseUUIDPipe) id: string) {
    return this.diaryService.togglePin(id);
  }

  @Patch(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle bookmark diary entry' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Bookmark toggled' })
  async toggleBookmark(@Param('id', ParseUUIDPipe) id: string) {
    return this.diaryService.toggleBookmark(id);
  }
}
