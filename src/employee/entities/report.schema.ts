import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  fileType: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  employeeId: string;

  @Prop({
    required: true,
    enum: ['pending', 'approved', 'rejected', 'mailed'],
    default: 'pending',
  })
  status: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
