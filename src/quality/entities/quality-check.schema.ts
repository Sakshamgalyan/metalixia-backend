import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type QualityCheckDocument = QualityCheck & Document;

export class QualityParameter {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  expected: string;

  @Prop({ default: '' })
  actual: string;

  @Prop({ default: false })
  passed: boolean;
}

@Schema({ timestamps: true })
export class QualityCheck {
  @Prop({ required: true })
  productionOrderId: string;

  @Prop({ required: true })
  batchId: string;

  @Prop({ required: true })
  companyName: string;

  @Prop({ required: true })
  partName: string;

  @Prop({ required: true })
  partNumber: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ default: null })
  inspectedBy: string;

  @Prop({ default: null })
  inspectedById: string;

  @Prop({ default: 'pending' })
  result: string; // pending | passed | failed

  @Prop({ default: null })
  defectType: string;

  @Prop({ default: null })
  defectDescription: string;

  @Prop({ type: [Object], default: [] })
  parameters: QualityParameter[];

  @Prop({ default: null })
  rejectionReason: string;

  @Prop({ type: Date, default: null })
  inspectedAt: Date | null;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const QualityCheckSchema = SchemaFactory.createForClass(QualityCheck);
