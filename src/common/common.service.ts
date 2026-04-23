
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from './entities/counter.schema';

@Injectable()
export class CommonService {
  constructor(
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
  ) {}

  async getNextSequenceValue(modelName: string): Promise<number> {
    const sequenceDocument = await this.counterModel.findOneAndUpdate(
      { modelName },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    return sequenceDocument.seq;
  }

  async generateEmployeeId(): Promise<string> {
    const seq = await this.getNextSequenceValue('user');
    // Format: EMP001, EMP002, etc.
    return `EMP${seq.toString().padStart(3, '0')}`;
  }
}

