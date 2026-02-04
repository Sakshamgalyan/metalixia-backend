import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule { }
