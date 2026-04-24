import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductionOrderDocument = ProductionOrder & Document;

export class ProcessStep {
  @Prop({ required: true })
  name: string;

  @Prop({ default: 'pending' })
  status: string; // pending | in_progress | completed | skipped

  @Prop({ type: Date, default: null })
  startedAt: Date | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ default: '' })
  notes: string;
}

export const ELECTROPLATING_PROCESSES = [
  'Degreasing',
  'Rinsing (1st)',
  'Acid Dipping',
  'Rinsing (2nd)',
  'Zinc Electroplating',
  'Rinsing (3rd)',
  'Passivation',
  'Rinsing (4th)',
  'Drying',
  'Heating / Baking',
  'Visual Inspection',
  'Final Cleaning',
];

@Schema({ timestamps: true })
export class ProductionOrder {
  @Prop({ required: true, unique: true })
  batchId: string;

  @Prop({ default: null })
  companyMaterialId: string;

  @Prop({ default: null })
  rawMaterialId: string;

  @Prop({ required: true })
  companyName: string;

  @Prop({ required: true })
  partName: string;

  @Prop({ required: true })
  partNumber: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unit: string;

  @Prop({ type: [Object], default: [] })
  processes: ProcessStep[];

  @Prop({ default: 0 })
  currentProcess: number;

  @Prop({ default: 1 })
  lineNumber: number;

  @Prop({ default: 'queued' })
  status: string; // queued | in_production | quality_check | passed | rejected | ready_for_dispatch | dispatched

  @Prop({ default: 'normal' })
  priority: string; // low | normal | high | urgent

  @Prop({ default: null })
  assignedTo: string;

  @Prop({ default: 0 })
  rejectionCount: number;

  @Prop({ type: Date, default: null })
  startedAt: Date | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ProductionOrderSchema =
  SchemaFactory.createForClass(ProductionOrder);
