import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PayslipDocument = Payslip & Document;

@Schema({ timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } })
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
}

export const PayslipSchema = SchemaFactory.createForClass(Payslip);
