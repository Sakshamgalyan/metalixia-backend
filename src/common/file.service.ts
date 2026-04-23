import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (existsSync(filePath)) {
        await fs.unlink(filePath);
        this.logger.log(`Deleted file: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Error deleting file ${filePath}: ${error.message}`);
      return false;
    }
  }

  async deleteFiles(filePaths: string[]): Promise<void> {
    await Promise.all(filePaths.map((path) => this.deleteFile(path)));
  }

  async fileExists(filePath: string): Promise<boolean> {
    return existsSync(filePath);
  }

  async moveFile(oldPath: string, newPath: string): Promise<void> {
    try {
      const dir = path.dirname(newPath);
      if (!existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true });
      }
      await fs.rename(oldPath, newPath);
      this.logger.log(`Moved file from ${oldPath} to ${newPath}`);
    } catch (error) {
      this.logger.error(
        `Error moving file from ${oldPath} to ${newPath}: ${error.message}`,
      );
      throw error;
    }
  }
}
