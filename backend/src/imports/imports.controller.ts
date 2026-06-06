import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Get,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportsService } from './imports.service';
import { JwtAuthGuard } from '../auth/guards';

@Controller('imports')
@UseGuards(JwtAuthGuard)
export class ImportsController {
  constructor(private importsService: ImportsService) {}

  @Post('assets/dry-run')
  @UseInterceptors(FileInterceptor('file'))
  async dryRun(
    @UploadedFile() file: any,
    @Body('strategy') strategy?: string,
    @Body('notes') notes?: string,
    @Req() req?: any,
  ) {
    return this.importsService.dryRun(file, strategy as any, notes, req?.user?.id ? Number(req.user.id) : undefined);
  }

  @Post('assets/execute/:batchId')
  async execute(@Param('batchId') batchId: string) {
    return this.importsService.execute(Number(batchId));
  }

  @Get('assets/batch/:batchId')
  async getBatch(@Param('batchId') batchId: string) {
    return this.importsService.getBatch(Number(batchId));
  }
}
