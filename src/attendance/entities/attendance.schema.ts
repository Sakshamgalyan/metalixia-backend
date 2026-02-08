import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } })
export class Attendance {
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

  @Prop({ required: true }) // Store uploader's ID
  uploadedBy: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
