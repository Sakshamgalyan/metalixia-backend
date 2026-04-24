import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { AuthGuard } from './guards/auth.guard';

@Controller('uploads')
@UseGuards(AuthGuard)
export class UploadsController {
  @Get('profiles/:filename')
  getProfilePicture(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', 'profiles', filename);

    if (!existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    return res.sendFile(filePath);
  }
}
