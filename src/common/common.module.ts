import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Counter, CounterSchema } from './entities/counter.schema';
import { FileService } from './file.service';
import { CommonService } from './common.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Counter.name, schema: CounterSchema }]),
  ],
  providers: [FileService, CommonService],
  exports: [FileService, CommonService, MongooseModule],
})
export class CommonModule {}
