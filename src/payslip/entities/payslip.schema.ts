import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PayslipDocument = Payslip & Document;

@Schema({ timestamps: true })
export class Payslip {
  @Prop({ required: true })
  employeeId: string;

  @Prop({ required: true })
  month: string;

  @Prop({ required: true })
  year: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  uploadedBy: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const PayslipSchema = SchemaFactory.createForClass(Payslip);
